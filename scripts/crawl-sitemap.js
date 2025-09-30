#!/usr/bin/env node

/**
 * Sitemap Crawler Script
 * Fetches XML sitemap, extracts URLs, and saves to JSON
 *
 * Usage: node scripts/crawl-sitemap.js <sitemap-url>
 * Example: node scripts/crawl-sitemap.js https://example.com/wp-sitemap.xml
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { parseString } = require('xml2js');

const SITEMAP_URL = process.argv[2];
const OUTPUT_FILE = path.join(__dirname, 'urls.json');

if (!SITEMAP_URL) {
  console.error('❌ Error: Please provide a sitemap URL');
  console.log('Usage: node scripts/crawl-sitemap.js <sitemap-url>');
  process.exit(1);
}

/**
 * Fetch XML content from URL
 */
async function fetchXML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse XML sitemap and extract URLs
 */
async function parseSitemap(xmlContent) {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { trim: true }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const urls = [];

      // Handle standard sitemap
      if (result.urlset && result.urlset.url) {
        result.urlset.url.forEach((entry) => {
          if (entry.loc && entry.loc[0]) {
            urls.push({
              url: entry.loc[0],
              lastmod: entry.lastmod ? entry.lastmod[0] : null,
              priority: entry.priority ? parseFloat(entry.priority[0]) : null,
            });
          }
        });
      }

      // Handle sitemap index (contains links to other sitemaps)
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        result.sitemapindex.sitemap.forEach((entry) => {
          if (entry.loc && entry.loc[0]) {
            urls.push({
              url: entry.loc[0],
              lastmod: entry.lastmod ? entry.lastmod[0] : null,
              isSitemap: true,
            });
          }
        });
      }

      resolve(urls);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`🔍 Fetching sitemap from: ${SITEMAP_URL}`);
    
    const xmlContent = await fetchXML(SITEMAP_URL);
    console.log('✅ Sitemap fetched successfully');
    
    console.log('📋 Parsing XML...');
    const urls = await parseSitemap(xmlContent);
    console.log(`✅ Found ${urls.length} URLs`);
    
    // Save to JSON file
    const output = {
      sitemapUrl: SITEMAP_URL,
      crawledAt: new Date().toISOString(),
      count: urls.length,
      urls: urls,
    };
    
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`💾 Saved to: ${OUTPUT_FILE}`);
    
    // Display sample URLs
    console.log('\n📄 Sample URLs:');
    urls.slice(0, 5).forEach((entry, i) => {
      console.log(`  ${i + 1}. ${entry.url}`);
    });
    
    if (urls.length > 5) {
      console.log(`  ... and ${urls.length - 5} more`);
    }
    
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
