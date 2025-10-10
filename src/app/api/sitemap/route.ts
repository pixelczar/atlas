import { NextRequest, NextResponse } from 'next/server';

interface SitemapUrl {
  url: string;
  lastmod?: string;
  priority?: number;
  sitemapSource?: string; // Which sitemap file this URL came from
}

/**
 * Sitemap API - Fetch and parse sitemap.xml from a domain
 * POST /api/sitemap
 * Body: { domain: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Normalize domain (remove protocol, trailing slash)
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    // Try common sitemap locations
    const sitemapUrls = [
      `https://${normalizedDomain}/sitemap.xml`,
      `https://${normalizedDomain}/sitemap_index.xml`,
      `https://${normalizedDomain}/wp-sitemap.xml`,
    ];

    let sitemapContent: string | null = null;
    let sitemapUrl: string | null = null;

    // Try each sitemap URL until we find one that works
    for (const url of sitemapUrls) {
      try {
        console.log(`Trying: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Atlas Sitemap Explorer/1.0',
          },
        });

        if (response.ok) {
          sitemapContent = await response.text();
          sitemapUrl = url;
          console.log(`✅ Found sitemap at: ${url}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Failed to fetch ${url}`);
        continue;
      }
    }

    if (!sitemapContent || !sitemapUrl) {
      return NextResponse.json(
        { error: 'No sitemap found. Tried: ' + sitemapUrls.join(', ') },
        { status: 404 }
      );
    }

    // Parse sitemap XML
    const urls = await parseSitemapXML(sitemapContent);

    // Extract unique sitemap sources
    const sitemapSources = [...new Set(urls.map(u => u.sitemapSource).filter(Boolean))];
    
    return NextResponse.json({
      success: true,
      domain: normalizedDomain,
      sitemapUrl,
      urlCount: urls.length,
      urls: urls, // Return all URLs, no limit
      totalUrls: urls.length,
      sitemaps: sitemapSources, // List of all sitemap files found
    });
  } catch (error) {
    console.error('Sitemap API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sitemap: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Parse sitemap XML and extract URLs
 * Handles both standard sitemaps and sitemap indexes (recursively)
 */
async function parseSitemapXML(xmlContent: string, depth = 0, sourceName = 'sitemap.xml'): Promise<SitemapUrl[]> {
  const MAX_DEPTH = 3; // Prevent infinite recursion
  const MAX_SITEMAPS = 50; // Limit number of sub-sitemaps to fetch
  
  if (depth > MAX_DEPTH) {
    console.log('⚠️ Max depth reached, stopping recursion');
    return [];
  }

  const urls: SitemapUrl[] = [];

  // Try to parse as a regular sitemap first
  const urlMatches = xmlContent.matchAll(/<url>([\s\S]*?)<\/url>/g);
  
  for (const match of urlMatches) {
    const urlBlock = match[1];
    const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/);
    const lastmodMatch = urlBlock.match(/<lastmod>(.*?)<\/lastmod>/);
    const priorityMatch = urlBlock.match(/<priority>(.*?)<\/priority>/);

    if (locMatch && locMatch[1]) {
      urls.push({
        url: locMatch[1].trim(),
        lastmod: lastmodMatch ? lastmodMatch[1].trim() : undefined,
        priority: priorityMatch ? parseFloat(priorityMatch[1]) : undefined,
        sitemapSource: sourceName,
      });
    }
  }

  // If URLs found, return them (this is a regular sitemap)
  if (urls.length > 0) {
    console.log(`✅ Found ${urls.length} URLs in ${sourceName} (depth ${depth})`);
    return urls;
  }

  // If no URLs, check if this is a sitemap index
  const sitemapMatches = xmlContent.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g);
  const sitemapUrls: string[] = [];

  for (const match of sitemapMatches) {
    const sitemapBlock = match[1];
    const locMatch = sitemapBlock.match(/<loc>(.*?)<\/loc>/);

    if (locMatch && locMatch[1]) {
      sitemapUrls.push(locMatch[1].trim());
    }
  }

  // If this is a sitemap index, recursively fetch all sub-sitemaps
  if (sitemapUrls.length > 0) {
    console.log(`📂 Found sitemap index with ${sitemapUrls.length} sub-sitemaps (depth ${depth})`);
    
    const allUrls: SitemapUrl[] = [];
    const sitemapsToFetch = sitemapUrls.slice(0, MAX_SITEMAPS);
    
    // Fetch sub-sitemaps in parallel (but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < sitemapsToFetch.length; i += batchSize) {
      const batch = sitemapsToFetch.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (sitemapUrl) => {
        try {
          // Extract filename from URL for tracking
          const urlParts = sitemapUrl.split('/');
          const filename = urlParts[urlParts.length - 1] || 'sitemap.xml';
          
          console.log(`🔍 Fetching sub-sitemap: ${filename}`);
          const response = await fetch(sitemapUrl, {
            headers: { 'User-Agent': 'Atlas Sitemap Explorer/1.0' },
          });

          if (response.ok) {
            const content = await response.text();
            const parsedUrls = await parseSitemapXML(content, depth + 1, filename);
            console.log(`✅ Parsed ${parsedUrls.length} URLs from ${filename}`);
            return parsedUrls;
          } else {
            console.log(`❌ Failed to fetch ${sitemapUrl}: ${response.status}`);
            return [];
          }
        } catch (error) {
          console.log(`❌ Error fetching ${sitemapUrl}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(urls => allUrls.push(...urls));
      
      console.log(`📊 Progress: ${allUrls.length} total URLs from ${i + batch.length} sitemaps`);
    }

    return allUrls;
  }

  // No URLs or sitemaps found
  console.log('⚠️ No URLs or sub-sitemaps found in XML');
  return [];
}

