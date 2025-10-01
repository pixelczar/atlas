# Nested Sitemap Support

## What's New

Atlas now fully supports **nested sitemaps** - where a sitemap index points to multiple sub-sitemaps.

## How It Works

### Before
- Atlas would only parse the top-level sitemap
- If it was a sitemap index, you'd only see links to sub-sitemaps
- No actual page URLs would be extracted

### After ✅
- Atlas detects sitemap indexes automatically
- Recursively fetches all sub-sitemaps (up to 3 levels deep)
- Parses all URLs from all sitemaps
- Aggregates everything into one complete project

## Example: reprise.com

When you enter `reprise.com`:

1. **Finds sitemap index** at `reprise.com/sitemap_index.xml`
   - Contains 13 sub-sitemaps

2. **Fetches all sub-sitemaps** in parallel:
   - `page-sitemap.xml` (83 URLs)
   - `blog_posts-sitemap.xml` 
   - `guides-sitemap.xml`
   - `events-sitemap.xml`
   - ... and 9 more

3. **Aggregates all URLs**
   - Total: ~200+ actual page URLs
   - All displayed as nodes in the canvas

## Technical Details

### Recursive Parsing

```typescript
async function parseSitemapXML(xmlContent: string, depth = 0) {
  // Try to parse as regular sitemap first
  const urls = extractUrls(xmlContent);
  
  if (urls.length > 0) {
    return urls; // Regular sitemap, return URLs
  }
  
  // Check if it's a sitemap index
  const subSitemaps = extractSitemapLinks(xmlContent);
  
  if (subSitemaps.length > 0) {
    // Fetch and parse all sub-sitemaps recursively
    const allUrls = [];
    for (const sitemapUrl of subSitemaps) {
      const content = await fetch(sitemapUrl);
      const parsedUrls = await parseSitemapXML(content, depth + 1);
      allUrls.push(...parsedUrls);
    }
    return allUrls;
  }
}
```

### Safety Limits

- **Max Depth**: 3 levels (prevents infinite recursion)
- **Max Sub-sitemaps**: 50 (prevents excessive fetching)
- **Max URLs**: 500 nodes per project (performance)
- **Batch Fetching**: 5 sitemaps at a time (prevents rate limiting)

### Performance Optimizations

1. **Parallel Fetching**: Fetches multiple sub-sitemaps simultaneously
2. **Batch Size**: Limits concurrency to 5 to avoid overwhelming servers
3. **Progress Logging**: Console logs show fetching progress
4. **Early Return**: Stops if URLs found (doesn't check for sitemaps)

## User Experience

### Loading State
- Shows "This may take a moment if the sitemap has multiple files"
- Loading spinner while fetching all sitemaps

### Preview State
- Shows total URL count from ALL sitemaps
- Warning if > 500 URLs (only first 500 will be added)
- Preview shows first 10 URLs

### Canvas
- All pages from all sitemaps displayed as nodes
- Grid layout with 10 columns
- 500 nodes max for optimal performance

## Example Domains to Test

✅ **Reprise.com** - Sitemap index with 13 sub-sitemaps (~200 URLs)
✅ **GitHub.blog** - WordPress sitemap with multiple files
✅ **WordPress.org** - Complex sitemap structure
✅ **Any Yoast SEO site** - Uses sitemap index pattern

## Console Output

When fetching nested sitemaps, you'll see:

```
🔍 Fetching sub-sitemap: https://www.reprise.com/page-sitemap.xml
✅ Found 83 URLs in sitemap (depth 1)
📊 Progress: 83 total URLs from 1 sitemaps

🔍 Fetching sub-sitemap: https://www.reprise.com/blog_posts-sitemap.xml
✅ Found 45 URLs in sitemap (depth 1)
📊 Progress: 128 total URLs from 2 sitemaps

...

📝 Creating 200 nodes for project abc123
✅ Batch 1 committed (200 nodes)
```

## Benefits

1. **Complete Site Maps**: Get ALL pages, not just sitemap indexes
2. **Automatic Discovery**: No manual navigation of sitemap structure
3. **Fast Processing**: Parallel fetching for speed
4. **Safe Limits**: Prevents performance issues and rate limiting
5. **Clear Feedback**: User knows what's happening

## Next Steps

- [ ] Add visual progress bar showing sub-sitemap fetching
- [ ] Allow user to select which sub-sitemaps to include
- [ ] Increase limit beyond 500 with pagination/virtualization
- [ ] Cache sitemap data to avoid re-fetching

---

**Try it now!** Enter `reprise.com` in the project creation modal and watch it automatically fetch and parse all 13 sub-sitemaps! 🎉

