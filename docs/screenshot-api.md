# Screenshot API Documentation

## Overview

The screenshot functionality in Atlas uses a multi-tier fallback approach to ensure screenshots work in all environments (local dev, production, serverless).

## How It Works

When you add a URL to the canvas, the system:

1. Creates a node in Firestore with `status: 'pending'`
2. Calls `/api/screenshot` to generate a thumbnail
3. Uploads the screenshot to Firebase Storage
4. Updates the node with the `thumbUrl` and sets `status: 'ready'`

## Screenshot Generation Strategy

The system tries these methods in order:

### 1. Screenshot API Service (Production) ✅

**Best for: Production deployments (Vercel, serverless)**

- Uses [ScreenshotOne API](https://screenshotone.com)
- Requires `SCREENSHOT_API_KEY` environment variable
- Free tier available: 100 screenshots/month
- Reliable, fast, works everywhere

**Setup:**
```bash
# Get API key from https://screenshotone.com
# Add to .env.local:
SCREENSHOT_API_KEY=your-api-key-here
```

### 2. Puppeteer (Local Development) ⚙️

**Best for: Local development**

- Automatically used if no `SCREENSHOT_API_KEY` is set
- Requires `puppeteer` package (already in devDependencies)
- Works great locally but **fails in serverless environments**

### 3. Placeholder Image (Fallback) 📦

**Best for: Always works**

- Uses placeholder.com to generate a simple image
- Shows the website's hostname as text
- Guaranteed to work but not useful for previews

## Environment Setup

### For Local Development

No setup needed! Puppeteer works out of the box:

```bash
npm install
npm run dev
```

### For Production Deployment

Add the screenshot API key to your environment:

**Vercel:**
```bash
vercel env add SCREENSHOT_API_KEY
```

**Other platforms:**
Add `SCREENSHOT_API_KEY` to your environment variables dashboard.

## API Endpoint

### POST `/api/screenshot`

**Request:**
```json
{
  "url": "https://example.com",
  "nodeId": "node-abc123", 
  "projectId": "project-xyz789"
}
```

**Response (Success):**
```json
{
  "success": true,
  "thumbUrl": "https://firebasestorage.googleapis.com/...",
  "nodeId": "node-abc123"
}
```

**Response (Error):**
```json
{
  "error": "Failed to generate screenshot",
  "details": "Error message here"
}
```

## Troubleshooting

### Error: "Module not found: Can't resolve 'puppeteer'"

**Solution:** Restart the dev server. Puppeteer is dynamically imported and should work.

### Screenshots not working in production

**Solution:** Add `SCREENSHOT_API_KEY` environment variable with a valid ScreenshotOne API key.

### Getting placeholder images instead of real screenshots

**Causes:**
1. No `SCREENSHOT_API_KEY` set (using Puppeteer fallback that failed in serverless)
2. Screenshot API quota exceeded
3. Target URL is inaccessible or blocking automated access

**Solution:** 
- Verify `SCREENSHOT_API_KEY` is set correctly
- Check API quota at screenshotone.com
- Try a different URL to confirm the service is working

## Alternative Screenshot Services

If you prefer a different service, modify `src/app/api/screenshot/route.ts`:

### ApiFlash (alternative)
```typescript
const apiUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${API_KEY}&url=${encodeURIComponent(url)}&width=1280&height=720&format=jpeg&quality=80`;
```

### URLBox (alternative)
```typescript
const apiUrl = `https://api.urlbox.io/v1/${API_KEY}/jpeg?url=${encodeURIComponent(url)}&width=1280&height=720&quality=80`;
```

## Cost Considerations

- **Puppeteer:** Free, but only works locally
- **ScreenshotOne:** Free tier 100/month, then $9/1000 screenshots
- **ApiFlash:** Free tier 100/month, then $6/1000 screenshots
- **URLBox:** From $19/month for 5000 screenshots

For most use cases, the free tier of any service is sufficient for development and small projects.
