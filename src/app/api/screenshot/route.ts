import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

const storage = getStorage();
const db = getFirestore();

const SCREENSHOT_TIMEOUT = 10000; // 10 seconds

/**
 * Generate a smart placeholder SVG for a URL
 */
function generatePlaceholderSVG(url: string): string {
  const hostname = new URL(url).hostname.replace('www.', '');
  const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || 'Home';
  
  // Convert slug to title
  const title = lastSegment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Generate a consistent color based on URL
  const hash = hostname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 85%);stop-opacity:1" />
      <stop offset="100%" style="stop-color:hsl(${hue}, 60%, 75%);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#grad)"/>
  
  <!-- Grid pattern -->
  <g opacity="0.1">
    <line x1="0" y1="240" x2="1280" y2="240" stroke="hsl(${hue}, 50%, 50%)" stroke-width="2"/>
    <line x1="0" y1="480" x2="1280" y2="480" stroke="hsl(${hue}, 50%, 50%)" stroke-width="2"/>
    <line x1="426" y1="0" x2="426" y2="720" stroke="hsl(${hue}, 50%, 50%)" stroke-width="2"/>
    <line x1="854" y1="0" x2="854" y2="720" stroke="hsl(${hue}, 50%, 50%)" stroke-width="2"/>
  </g>
  
  <!-- Content -->
  <g text-anchor="middle">
    <!-- Title -->
    <text x="640" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="600" fill="hsl(${hue}, 40%, 30%)" opacity="0.9">
      ${title}
    </text>
    
    <!-- Domain -->
    <text x="640" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="hsl(${hue}, 30%, 40%)" opacity="0.6">
      ${hostname}
    </text>
    
    <!-- Icon -->
    <circle cx="640" cy="450" r="60" fill="white" opacity="0.3"/>
    <circle cx="640" cy="450" r="50" fill="none" stroke="hsl(${hue}, 40%, 30%)" stroke-width="3" opacity="0.4"/>
    <path d="M 620 440 L 660 440 M 640 420 L 640 460 M 620 430 L 640 410 L 660 430" 
          stroke="hsl(${hue}, 40%, 30%)" stroke-width="3" fill="none" opacity="0.4"/>
  </g>
  
  <!-- Watermark -->
  <text x="640" y="680" font-family="system-ui, -apple-system, sans-serif" font-size="16" 
        fill="hsl(${hue}, 30%, 40%)" opacity="0.3" text-anchor="middle">
    Preview not available
  </text>
</svg>`;
}

/**
 * Try to capture screenshot using external API with timeout
 */
async function captureScreenshotWithTimeout(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT);

  try {
    const SCREENSHOT_API_KEY = process.env.SCREENSHOT_API_KEY;
    
    if (!SCREENSHOT_API_KEY) {
      console.log('⚠️  No SCREENSHOT_API_KEY, using placeholder');
      return null;
    }

    // Use ScreenshotOne API
    const apiUrl = `https://api.screenshotone.com/take?access_key=${SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=720&format=jpeg&image_quality=80&full_page=false&block_ads=true&block_cookie_banners=true&block_trackers=true`;
    
    console.log(`📸 Fetching screenshot from API for: ${url}`);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`❌ Screenshot API returned ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('⏱️  Screenshot API timeout');
    } else {
      console.error('❌ Screenshot API error:', error.message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * POST /api/screenshot
 * Generate screenshot for a URL and upload to Firebase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const { url, nodeId, projectId } = await request.json();

    if (!url || !nodeId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: url, nodeId, projectId' },
        { status: 400 }
      );
    }

    console.log(`📸 Screenshot request for ${url} (node: ${nodeId})`);

    // Try to get real screenshot with timeout
    let screenshotBuffer = await captureScreenshotWithTimeout(url);
    let filename = `screenshots/${projectId}/${nodeId}.jpg`;
    let contentType = 'image/jpeg';

    // Fallback to placeholder SVG if screenshot failed
    if (!screenshotBuffer) {
      console.log('📦 Using placeholder SVG for:', url);
      const svg = generatePlaceholderSVG(url);
      screenshotBuffer = Buffer.from(svg);
      filename = `screenshots/${projectId}/${nodeId}.svg`;
      contentType = 'image/svg+xml';
    }

    // Upload to Firebase Storage
    const storageRef = ref(storage, filename);
    const metadata = {
      contentType,
      customMetadata: {
        url,
        nodeId,
        projectId,
        generatedAt: new Date().toISOString(),
      },
    };

    await uploadBytes(storageRef, screenshotBuffer, metadata);
    const thumbUrl = await getDownloadURL(storageRef);

    // Update Firestore node
    const nodeRef = doc(db, `projects/${projectId}/nodes`, nodeId);
    await updateDoc(nodeRef, {
      thumbUrl,
      'metadata.status': 'ready',
      'metadata.screenshotAt': new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Screenshot uploaded: ${thumbUrl}`);

    return NextResponse.json({
      success: true,
      thumbUrl,
      nodeId,
      isPlaceholder: !screenshotBuffer,
    });
  } catch (error: any) {
    console.error('❌ Screenshot generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate screenshot', details: error.message },
      { status: 500 }
    );
  }
}

