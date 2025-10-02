# Screenshot & Selection Toolbar Fixes

## Issues Fixed

### 1. **Screenshots Stuck on "Generating screenshot..."**

**Problem:** The `/api/screenshot` route was deleted, causing all screenshot requests to fail. Nodes stayed in `pending` status indefinitely.

**Solution:** Recreated `/src/app/api/screenshot/route.ts` with:
- **10-second timeout** on screenshot API calls
- **Smart fallback placeholder** - generates a beautiful, color-coded SVG placeholder if:
  - Screenshot API times out
  - No `SCREENSHOT_API_KEY` is set
  - API fails for any reason
- **Placeholder features:**
  - URL-based color generation (consistent colors per domain)
  - Shows page title extracted from URL path
  - Displays domain name
  - Clean, minimal design that fits the Atlas aesthetic

### 2. **Missing Node Card Submenu (SelectionToolbar)**

**Problem:** The SelectionToolbar was positioned **outside** the ReactFlow component, causing it to not move with the canvas when panning/zooming.

**Solution:** Moved the SelectionToolbar **inside** the ReactFlow component so it:
- Properly tracks with selected nodes when you pan/zoom
- Uses React Flow's coordinate system
- Appears positioned next to selected nodes

### 3. **Iframe Preview Modal** (New Feature!)

**Added:** Large iframe preview overlay that appears when you click the "maximize" button on the SelectionToolbar.

**Features:**
- **85vw x 85vh** modal with smooth animations
- Click outside or ESC to close
- Header shows the URL
- "Open in New Tab" button for full browser experience
- Proper iframe sandboxing for security
- Overlays the canvas (doesn't open in new tab)

## How It Works Now

1. **Add a node** → Screenshot API is called with 10s timeout
2. **If successful** → Real screenshot uploaded to Firebase Storage
3. **If timeout/failure** → Beautiful placeholder SVG generated
4. **Select a node** → SelectionToolbar appears next to it
5. **Click maximize icon** → Large iframe preview modal opens over canvas
6. **Click outside or X** → Modal closes

## Configuration

### For Real Screenshots (Production)

Add to `.env.local`:
```bash
SCREENSHOT_API_KEY=your-screenshotone-api-key
```

Get a free API key at: https://screenshotone.com
- Free tier: 100 screenshots/month
- Paid: $9/1000 screenshots

### For Development (No API Key)

No configuration needed! Placeholders work automatically.

## Files Modified

- `/src/app/api/screenshot/route.ts` - **Created** - Screenshot API with timeout & fallback
- `/src/components/flow/SiteMapFlow.tsx` - **Updated** - Fixed SelectionToolbar positioning, added iframe modal
- `/src/lib/node-operations.ts` - **No changes needed** - Already calling `/api/screenshot`

## Technical Details

### Smart Placeholder SVG

The placeholder isn't just a gray box - it:
1. Extracts the page title from the URL (e.g., `/about-us` → "About Us")
2. Generates a consistent hue based on domain hash (same domain = same color)
3. Creates a gradient background with grid pattern
4. Shows page icon, title, and domain
5. Outputs as SVG (tiny file size, crisp at any scale)

### SelectionToolbar Positioning

Before:
```tsx
</ReactFlow>
<SelectionToolbar ... />  ❌ Outside ReactFlow
```

After:
```tsx
<ReactFlow>
  <SelectionToolbar ... />  ✅ Inside ReactFlow
</ReactFlow>
```

This ensures the toolbar uses React Flow's coordinate system and tracks with the canvas.

## Testing

1. **Test screenshot timeout:** Add a very slow URL (will timeout → placeholder)
2. **Test selection toolbar:** Select a node → toolbar appears next to it
3. **Test iframe modal:** Click maximize icon → modal opens with live preview
4. **Test real screenshots:** Add `SCREENSHOT_API_KEY` → should get real thumbnails

## Future Improvements

- Add retry logic for failed screenshots
- Cache placeholders to avoid regenerating
- Add loading state to iframe modal
- Support multiple screenshot providers
- Add screenshot quality settings

