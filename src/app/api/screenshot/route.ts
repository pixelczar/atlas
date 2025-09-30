import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import puppeteer from 'puppeteer';

// Initialize Firebase (server-side)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const storage = getStorage();
const db = getFirestore();

/**
 * Calculate grid position for new node
 */
function calculateGridPosition(existingNodes: Array<{ position: { x: number; y: number } }>): { x: number; y: number } {
  const baseX = 400;
  const baseY = 100;
  
  if (existingNodes.length === 0) {
    return { x: baseX, y: baseY };
  }

  // Grid layout parameters
  const nodeWidth = 288; // Width of each node (matches the CSS - w-72 = 288px)
  const nodeHeight = 144; // Approximate height of each node (h-36 = 144px)
  const spacing = 60; // Space between nodes (increased to prevent collisions)
  const nodesPerRow = 3; // Number of nodes per row (reduced for better spacing)
  
  // Calculate grid position
  const nodeIndex = existingNodes.length;
  const row = Math.floor(nodeIndex / nodesPerRow);
  const col = nodeIndex % nodesPerRow;
  
  // Calculate position with proper spacing
  const x = baseX + (col * (nodeWidth + spacing));
  const y = baseY + (row * (nodeHeight + spacing));
  
  return { x, y };
}

/**
 * Generate a real screenshot using Puppeteer
 */
async function generateScreenshot(url: string): Promise<Buffer> {
  console.log('📸 Generating real screenshot for:', url);
  
  let browser;
  try {
    // Launch browser with anti-detection settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--disable-default-apps',
        '--disable-extensions',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    const page = await browser.newPage();
    
    // Anti-bot evasion: Set realistic User-Agent with random variations
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);
    
    // Anti-bot evasion: Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    });

            // Anti-bot evasion: Override webdriver detection and automation indicators
            await page.evaluateOnNewDocument(() => {
              // Remove webdriver property
              Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
              });

              // Remove automation indicators
              delete (window as any).chrome;
              delete (window as any).__nightmare;
              delete (window as any).__phantomas;
              delete (window as any).callPhantom;
              delete (window as any)._phantom;
              delete (window as any).phantom;
              delete (window as any).__selenium;
              delete (window as any).__webdriver;
              delete (window as any).__driver_evaluate;
              delete (window as any).__webdriver_evaluate;
              delete (window as any).__selenium_evaluate;
              delete (window as any).__fxdriver_evaluate;
              delete (window as any).__driver_unwrapped;
              delete (window as any).__webdriver_unwrapped;
              delete (window as any).__selenium_unwrapped;
              delete (window as any).__fxdriver_unwrapped;

              // Override plugins with realistic data
              Object.defineProperty(navigator, 'plugins', {
                get: () => ({
                  length: 3,
                  0: { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
                  1: { name: 'Chrome PDF Viewer', description: '' },
                  2: { name: 'Native Client', description: '' }
                }),
              });

              // Override languages
              Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
              });

              // Override permissions
              const originalQuery = window.navigator.permissions.query;
              window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                  Promise.resolve({ state: Notification.permission }) :
                  originalQuery(parameters)
              );

              // Override getBattery
              Object.defineProperty(navigator, 'getBattery', {
                get: () => () => Promise.resolve({
                  charging: true,
                  chargingTime: 0,
                  dischargingTime: Infinity,
                  level: 1
                }),
              });

              // Override connection
              Object.defineProperty(navigator, 'connection', {
                get: () => ({
                  effectiveType: '4g',
                  rtt: 50,
                  downlink: 2
                }),
              });

              // Override hardwareConcurrency
              Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => 8,
              });

              // Override deviceMemory
              Object.defineProperty(navigator, 'deviceMemory', {
                get: () => 8,
              });

              // Override screen properties
              Object.defineProperty(screen, 'availHeight', {
                get: () => 1055,
              });
              Object.defineProperty(screen, 'availWidth', {
                get: () => 1920,
              });

              // Override timezone
              Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
                value: function() {
                  return { timeZone: 'America/New_York' };
                }
              });

              // Override canvas fingerprinting
              const getContext = HTMLCanvasElement.prototype.getContext;
              HTMLCanvasElement.prototype.getContext = function(type, ...args) {
                if (type === '2d') {
                  const context = getContext.apply(this, [type, ...args]);
                  const originalFillText = context.fillText;
                  context.fillText = function(...args) {
                    // Add slight randomness to prevent fingerprinting
                    const x = args[1] + Math.random() * 0.1;
                    const y = args[2] + Math.random() * 0.1;
                    return originalFillText.apply(this, [args[0], x, y, ...args.slice(3)]);
                  };
                  return context;
                }
                return getContext.apply(this, [type, ...args]);
              };
            });
    
    // Anti-bot evasion: Set viewport to look like a real browser
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });

    // Anti-bot evasion: Random delay before navigation
    const preDelay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, preDelay));

    // Navigate to the URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Anti-bot evasion: Simulate human-like behavior
    // Random mouse movement with realistic timing
    const mouseSteps = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < mouseSteps; i++) {
      await page.mouse.move(
        Math.random() * 1280,
        Math.random() * 720,
        { steps: Math.floor(Math.random() * 10) + 5 }
      );
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    }

    // Random scroll behavior with pauses
    await page.evaluate(() => {
      window.scrollTo(0, Math.random() * 200);
    });
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    // Simulate reading behavior - hover over elements
    try {
      const elements = await page.$$('a, button, h1, h2, h3');
      if (elements.length > 0) {
        const randomElement = elements[Math.floor(Math.random() * Math.min(elements.length, 5))];
        await randomElement.hover();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
      }
    } catch (error) {
      // Ignore hover errors
    }

    // Wait for dynamic content with random delay
    const postDelay = Math.random() * 2000 + 1000; // 1000-3000ms
    await new Promise(resolve => setTimeout(resolve, postDelay));

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false
    });

    console.log('✅ Screenshot captured successfully');
    return { buffer: screenshot as Buffer, isRealScreenshot: true };

  } catch (error) {
    console.error('❌ Screenshot generation failed for URL:', url);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Fallback to placeholder if screenshot fails
    console.log('🔄 Falling back to placeholder for:', url);
  const hostname = new URL(url).hostname;
  const svg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#DDEEF9"/>
      <text x="50%" y="40%" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="48" fill="#1a1a1a" opacity="0.8">
        ${hostname}
      </text>
      <text x="50%" y="55%" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#4863B0" opacity="0.6">
          Screenshot failed
      </text>
      <text x="50%" y="70%" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#1a1a1a" opacity="0.4">
          Using placeholder
      </text>
    </svg>
  `.trim();
  
    return { buffer: Buffer.from(svg), isRealScreenshot: false };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, nodeId, projectId } = await request.json();

    if (!url || !nodeId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: url, nodeId, projectId' },
        { status: 400 }
      );
    }

    // Get existing nodes to calculate proper grid position
    const nodesRef = collection(db, `projects/${projectId}/nodes`);
    const existingNodesSnapshot = await getDocs(nodesRef);
    const existingNodes = existingNodesSnapshot.docs.map(doc => ({
      position: doc.data().position || { x: 0, y: 0 }
    }));

    // Calculate proper grid position
    const position = calculateGridPosition(existingNodes);

    // Generate screenshot
    const screenshotResult = await generateScreenshot(url);
    const screenshot = screenshotResult.buffer;
    const isRealScreenshot = screenshotResult.isRealScreenshot;

    // Upload to Firebase Storage (path matches storage rules)
    const filename = `projects/${projectId}/screenshots/${nodeId}.jpg`;
    const storageRef = ref(storage, filename);
    
    // Determine content type based on buffer content
    const contentType = screenshot.toString().startsWith('<svg') ? 'image/svg+xml' : 'image/jpeg';
    
    try {
      await uploadBytes(storageRef, screenshot, {
        contentType,
      });

      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Firestore node with thumbnail URL
      const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);
      await updateDoc(nodeRef, {
        thumbUrl: downloadURL,
        'metadata.screenshotAt': new Date(),
        'metadata.status': 'ready',
      }).catch(async (error) => {
        // If document doesn't exist, create it first
        if (error.code === 'not-found') {
          console.log('Document not found, creating it first...');
          const { setDoc } = await import('firebase/firestore');
          await setDoc(nodeRef, {
            id: nodeId,
            url: url,
            thumbUrl: downloadURL,
            position: position,
            showIframe: false,
            title: new URL(url).hostname,
            description: null,
            parentId: null,
            metadata: {
              lastModified: new Date(),
              status: 'ready',
              screenshotAt: new Date(),
              updatedBy: 'system',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          throw error;
        }
      });

      return NextResponse.json({
        success: true,
        thumbUrl: downloadURL,
        nodeId,
        isRealScreenshot,
      });
    } catch (storageError) {
      console.error('Storage upload failed:', storageError);
      
      // Check if this is a Storage not enabled error
      const isStorageNotEnabled = storageError.code === 'storage/unknown' || 
                                 storageError.message?.includes('Storage has not been set up');
      
      if (isStorageNotEnabled) {
        console.log('⚠️ Firebase Storage not enabled. Using data URL fallback.');
        console.log('💡 To enable Storage: https://console.firebase.google.com/project/atlas-4dbd8/storage');
      }
      
      // Fallback: Return the screenshot data directly without storage
      const base64Data = screenshot.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Data}`;
      
      // Update Firestore node with data URL
      const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);
      await updateDoc(nodeRef, {
        thumbUrl: dataUrl,
        'metadata.screenshotAt': new Date(),
        'metadata.status': 'ready',
        'metadata.storageType': 'dataUrl',
        'metadata.storageError': isStorageNotEnabled ? 'storage-not-enabled' : 'upload-failed',
      }).catch(async (error) => {
        // If document doesn't exist, create it first
        if (error.code === 'not-found') {
          console.log('Document not found, creating it first...');
          const { setDoc } = await import('firebase/firestore');
          await setDoc(nodeRef, {
            id: nodeId,
            url: url,
            thumbUrl: dataUrl,
            position: position,
            showIframe: false,
            title: new URL(url).hostname,
            description: null,
            parentId: null,
            metadata: {
              lastModified: new Date(),
              status: 'ready',
              screenshotAt: new Date(),
              storageType: 'dataUrl',
              storageError: isStorageNotEnabled ? 'storage-not-enabled' : 'upload-failed',
              updatedBy: 'system',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          throw error;
        }
      });

      return NextResponse.json({
        success: true,
        thumbUrl: dataUrl,
        nodeId,
        isRealScreenshot,
        warning: isStorageNotEnabled 
          ? 'Screenshot saved as data URL (Firebase Storage not enabled - see console for setup instructions)'
          : 'Screenshot saved as data URL (Firebase Storage unavailable)',
        storageStatus: isStorageNotEnabled ? 'not-enabled' : 'unavailable',
        setupUrl: isStorageNotEnabled ? 'https://console.firebase.google.com/project/atlas-4dbd8/storage' : undefined,
      });
    }
  } catch (error) {
    console.error('Screenshot error:', error);
    return NextResponse.json(
      { error: 'Failed to generate screenshot', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
