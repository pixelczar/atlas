# Viewport-Aware Grid & Sitemap Browser ✨

## What's New

Three major improvements to make Atlas more flexible and useful:

1. **Viewport-Aware Grid Layout** - Dynamic column calculation
2. **Sitemap Browser** - Browse all pages after project creation
3. **URL Structure** - Support for nested diagrams (foundation)

---

## 1. Viewport-Aware Grid Layout ✅

### The Problem
- Grid was fixed to 3 columns regardless of screen size
- Wasted space on large monitors
- Too cramped on small screens

### The Solution
**Dynamic column calculation based on viewport width!**

```typescript
const nodeWidth = 288;       // Fixed card width
const spacing = 40;          // Space between cards
const padding = 100;         // Edge padding

const availableWidth = viewportWidth - (padding * 2);
const columnsPerRow = Math.floor(availableWidth / (nodeWidth + spacing));
```

### How It Works

**Small Screen (1400px):**
- Available width: 1200px
- Columns: ~3-4 nodes

**Medium Screen (1920px):**
- Available width: 1720px
- Columns: ~5 nodes

**Large Screen (2560px):**
- Available width: 2360px
- Columns: ~7 nodes

**Ultra-wide (3440px):**
- Available width: 3240px
- Columns: ~9-10 nodes

### Grid Button Behavior

When you click the **Grid button** in floating controls:
1. Reads current viewport width
2. Calculates optimal columns
3. Re-arranges all nodes to fill the space
4. Auto-fits view to show everything

```typescript
// Get viewport width
const viewportWidth = window.innerWidth;

// Re-grid with viewport awareness
await regridAllNodes(projectId, nodes, viewportWidth);

// Fit view after re-gridding
setTimeout(() => fitView(), 500);
```

---

## 2. Sitemap Browser ✅

### The Feature
**Browse all pages in a project after creation!**

New modal that shows:
- Complete list of all pages
- Search/filter functionality
- Direct links to each page
- Quick access to canvas view

### How to Use

**From Dashboard:**
1. Find any project card
2. Click **"Browse Sitemap"** button (at bottom of card)
3. Modal opens with full page list
4. Search, filter, or click to open pages

### UI Components

**Header:**
- Project name
- Total page count
- "View Diagram" button → Opens canvas

**Search Bar:**
- Real-time filtering
- Searches both title and URL
- Shows filtered count

**Page List:**
- Scrollable list of all pages
- Title + URL for each page
- External link button (hover to reveal)
- Smooth stagger animations

**Footer:**
- Shows count: "X of Y pages" when filtered

### Features

✅ **Real-time search** - Filter as you type
✅ **Smooth animations** - Staggered reveals  
✅ **External links** - Open any page in new tab  
✅ **Quick canvas access** - Button to view diagram  
✅ **Responsive** - Works on all screen sizes  
✅ **Glass morphism** - Beautiful backdrop blur  

### Technical Details

```tsx
// Fetches all nodes from project
const nodesRef = collection(db, `projects/${projectId}/nodes`);
const snapshot = await getDocs(q);

// Filters in real-time
const filteredNodes = nodes.filter(node => 
  node.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  node.title?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

---

## 3. URL Structure for Nested Diagrams 🚧

### The Foundation

Projects now use clean URL structure:
- `/canvas?project={projectId}` - Main canvas
- `/dashboard` - All projects
- Future: `/canvas?project={projectId}&view={viewId}` - Nested views

### Future Enhancements

**Planned features:**
- Create sub-diagrams from selection
- Hierarchical project organization
- Multiple views per project
- Shareable view links

**Example URL structure:**
```
/canvas?project=abc123                    // Main view
/canvas?project=abc123&view=blog-pages    // Blog pages only
/canvas?project=abc123&view=product-tour  // Product tour
```

---

## 📊 Visual Comparison

### Grid Layout

**Before:**
```
[Node] [Node] [Node]
[Node] [Node] [Node]
[Node] [Node] [Node]
```
Always 3 columns, lots of wasted space on large screens

**After:**
```
Small:  [Node] [Node] [Node] [Node]
Medium: [Node] [Node] [Node] [Node] [Node]
Large:  [Node] [Node] [Node] [Node] [Node] [Node] [Node]
```
Fills the viewport dynamically!

### Dashboard Cards

**Before:**
```
┌────────────────┐
│  Project Name  │
│  domain.com    │
│  50 pages      │
└────────────────┘
```

**After:**
```
┌────────────────┐
│  Project Name  │  ← Click to open canvas
│  domain.com    │
│  50 pages      │
├────────────────┤
│ Browse Sitemap │  ← NEW! Click to browse
└────────────────┘
```

---

## 🎯 User Flows

### Creating & Browsing a Project

1. **Dashboard** → Click "New Project"
2. Enter domain → Create project
3. Redirected to canvas with all nodes
4. **Grid button** → Nodes fill viewport
5. **Back to Dashboard**
6. **"Browse Sitemap"** → See all pages
7. Search for specific pages
8. Click external link to visit
9. Click "View Diagram" to return to canvas

### Using Different Screen Sizes

**On Ultra-wide Monitor:**
1. Open canvas with 200 nodes
2. Click Grid button
3. Nodes arrange in 9-10 columns
4. Everything fills the screen beautifully

**On Laptop:**
1. Same project
2. Click Grid button
3. Nodes arrange in 4-5 columns
4. Perfect spacing for smaller screen

---

## 🎨 Design Consistency

All new components match the existing design system:

**Colors:**
- Border: `#5B98D6/20`
- Hover: `#5B98D6/40`
- Primary: `#4863B0`
- Background: `white/95` with backdrop blur

**Animations:**
- Smooth fade/scale for modal entrance
- Staggered list items (20ms delay each)
- Hover scale effects on buttons

**Typography:**
- Headings: Serif font
- Body: Sans-serif
- Consistent sizing and spacing

---

## 🚀 Try It Out

**Test Viewport Grid:**
1. Open any project in canvas
2. Resize browser window
3. Click **Grid button** (bottom controls)
4. Watch nodes reorganize to fill space
5. Try different window sizes!

**Test Sitemap Browser:**
1. Go to Dashboard: `http://localhost:3001/dashboard`
2. Find a project
3. Click **"Browse Sitemap"** button
4. Search for pages
5. Click external links
6. Click "View Diagram" to see canvas

---

## 📈 Benefits

### Viewport-Aware Grid
- ✅ Better space utilization
- ✅ Works on any screen size
- ✅ Professional auto-layout
- ✅ One-click reorganization

### Sitemap Browser
- ✅ Easy access to all pages
- ✅ Search/filter functionality
- ✅ Quick external links
- ✅ Alternative view of project

### URL Structure
- ✅ Clean, shareable links
- ✅ Foundation for nested views
- ✅ Browser history support
- ✅ Future: Multiple diagrams per project

---

## 🔮 What's Next

**Phase 1 (Completed):**
- ✅ Viewport-aware grid
- ✅ Sitemap browser
- ✅ Clean URL structure

**Phase 2 (Future):**
- [ ] Create sub-diagrams from selection
- [ ] Save multiple views per project
- [ ] Hierarchical folder organization
- [ ] Share specific views with custom links

**Phase 3 (Future):**
- [ ] Nested diagram editor
- [ ] Auto-generate views by URL pattern
- [ ] View templates (e.g., "Blog Posts", "Products")
- [ ] Multi-level zoom (overview → details)

---

**Your projects now intelligently fill the viewport and you can browse sitemaps anytime!** ✨

