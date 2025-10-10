import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch Open Graph images and other meta images
 * This bypasses CORS issues by fetching on the server side
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the page content
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Atlas/1.0; +https://atlas.example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch page' }, { status: response.status });
    }

    const html = await response.text();
    
    // Extract Open Graph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const ogImageUrl = ogImageMatch?.[1];
    
    // Extract Twitter image as fallback
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const twitterImageUrl = twitterImageMatch?.[1];
    
    // Extract Apple touch icon
    const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    const appleTouchUrl = appleTouchMatch?.[1];
    
    // Extract favicon
    const faviconMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    const faviconUrl = faviconMatch?.[1];

    // Return the best available image
    const images = [
      { url: ogImageUrl, type: 'og:image' },
      { url: twitterImageUrl, type: 'twitter:image' },
      { url: appleTouchUrl, type: 'apple-touch-icon' },
      { url: faviconUrl, type: 'favicon' },
    ].filter(img => img.url);

    // Return the first valid image
    if (images.length > 0) {
      return NextResponse.json({ 
        success: true, 
        imageUrl: images[0].url,
        type: images[0].type,
        allImages: images 
      });
    }

    return NextResponse.json({ error: 'No images found' }, { status: 404 });

  } catch (error) {
    console.error('OG Image API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OG image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
