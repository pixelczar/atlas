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
    
    // Inject error-suppressing script to prevent crashes in proxy context
    // This is a preview-only context, so we aggressively suppress errors
    const errorSuppressionScript = `
      <script>
        (function() {
          // Suppress history manipulation errors
          var originalReplaceState = history.replaceState;
          var originalPushState = history.pushState;

          history.replaceState = function() {
            try {
              return originalReplaceState.apply(history, arguments);
            } catch (e) {
              if (e.name !== 'SecurityError') throw e;
            }
          };

          history.pushState = function() {
            try {
              return originalPushState.apply(history, arguments);
            } catch (e) {
              if (e.name !== 'SecurityError') throw e;
            }
          };

          // Suppress ALL uncaught errors - this is a preview context
          // Catches errors before they reach framework error boundaries
          window.onerror = function() { return true; };
          window.onunhandledrejection = function(e) { if (e && e.preventDefault) e.preventDefault(); };

          window.addEventListener('error', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return true;
          }, true);

          window.addEventListener('unhandledrejection', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }, true);

          // Suppress console errors for expected proxy-context failures
          var originalConsoleError = console.error;
          console.error = function() {
            var message = Array.prototype.join.call(arguments, ' ');
            if (
              message.includes('CORS') ||
              message.includes('Access-Control') ||
              message.includes('ERR_FAILED') ||
              message.includes('ERR_BLOCKED') ||
              message.includes('net::ERR_') ||
              message.includes('SecurityError') ||
              message.includes('replaceState') ||
              message.includes('pushState') ||
              message.includes('Hydration') ||
              message.includes('hydrat') ||
              message.includes('Minified React error')
            ) {
              return;
            }
            originalConsoleError.apply(console, arguments);
          };
        })();
      </script>
    `;
    
    // Strip CSP meta tags that would block our injected scripts
    html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?Content-Security-Policy["']?[^>]*>/gi, '');
    // Strip X-Frame-Options meta tags
    html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?X-Frame-Options["']?[^>]*>/gi, '');

    // Try to insert base tag and error suppression script in the head
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}${errorSuppressionScript}`);
    } else if (html.includes('<html')) {
      // Insert after opening html tag
      html = html.replace(/<html[^>]*>/, `$&<head>${baseTag}${errorSuppressionScript}</head>`);
    } else {
      // No html structure, prepend base tag and script
      html = `${baseTag}${errorSuppressionScript}${html}`;
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

