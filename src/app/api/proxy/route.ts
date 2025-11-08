import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API - Fetches a page server-side and strips X-Frame-Options headers
 * GET /api/proxy?url=https://example.com
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
    // Only allow http/https protocols for security
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are allowed' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    );
  }

  try {
    // Fetch the page server-side
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Atlas/1.0; +https://atlas.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the HTML content
    let html = await response.text();

    // Inject base tag to fix relative URLs
    // This ensures images, CSS, JS, etc. load from the original domain
    const baseTag = `<base href="${targetUrl}" target="_blank">`;
    
    // Try to insert base tag in the head, or at the beginning if no head exists
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`);
    } else if (html.includes('<html')) {
      // Insert after opening html tag
      html = html.replace(/<html[^>]*>/, `$&<head>${baseTag}</head>`);
    } else {
      // No html structure, prepend base tag
      html = `${baseTag}${html}`;
    }

    // Create a new response with the HTML
    const proxiedResponse = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Remove X-Frame-Options by not including it
        // Remove Content-Security-Policy frame-ancestors
        'X-Content-Type-Options': 'nosniff',
        // Allow iframe embedding
        'X-Frame-Options': 'ALLOWALL', // This will be ignored, but we set it to allow
      },
    });

    // Remove any X-Frame-Options or CSP headers that might have been set
    // by removing them from the response headers
    
    return proxiedResponse;
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: `Failed to proxy: ${error.message}` },
      { status: 500 }
    );
  }
}

