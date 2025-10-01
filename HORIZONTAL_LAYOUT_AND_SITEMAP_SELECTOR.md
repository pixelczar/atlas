# Horizontal Layout + Multiple Sitemap Support 🌳

## Two Major Improvements

### 1. Horizontal Tree Layout (Left → Right) ✅
Fixed the hard-to-parse vertical layout with an **org-chart style** horizontal tree!

### 2. Multiple Sitemap Selector ✅
Added support for viewing different sub-sitemaps separately with a beautiful dropdown!

---

## 1. Horizontal Tree Layout

### The Problem
- Vertical layout (top-to-bottom) was hard to read
- Deep hierarchies created very tall diagrams
- Difficult to follow parent-child relationships

### The Solution: LEFT-TO-RIGHT Layout

```
Root → Child → Grandchild
```

**Before (Vertical - Hard to Read):**
```
      [root]
         |
    [child-1]
         |
  [grandchild-1]
```

**After (Horizontal - Easy to Read!):**
```
[root] → [child-1] → [grandchild-1]
           ↓
       [child-2] → [grandchild-2]
```

### How It Works

**Layout Logic:**
- **X-axis (horizontal)** = Depth level (0, 1, 2, 3...)
- **Y-axis (vertical)** = Sibling index (which child am I?)

```typescript
// Horizontal layout calculation
x = startX + (depth * horizontalSpacing)    // 400px per level
y = startY + (verticalIndex * verticalSpacing)  // 180px per sibling
```

**Example Positions:**
```
Root (depth 0):         x=100,  y=100
Child 1 (depth 1):      x=500,  y=100
Child 2 (depth 1):      x=500,  y=280
Grandchild (depth 2):   x=900,  y=100
```

### Visual Example

**URL Structure:**
```
reprise.com/
├── blog/
│   ├── post-1
│   └── post-2
└── products/
    └── demo
```

**Rendered (Horizontal):**
```
                        ┌─ [post-1]
        ┌─ [blog/] ─────┤
        │               └─ [post-2]
[/] ────┤
        │
        └─ [products/] ─── [demo]
```

Much easier to scan left-to-right!

---

## 2. Multiple Sitemap Selector

### The Problem
Sites often have multiple sitemaps:
- `page-sitemap.xml` (main pages)
- `blog-sitemap.xml` (blog posts)
- `product-sitemap.xml` (products)
- `category-sitemap.xml` (categories)

Before: All mixed together - overwhelming!

### The Solution: Sitemap Dropdown

Beautiful dropdown to filter which sitemap you're viewing!

**Location:** Top toolbar (left side, before Add Node input)

**Options:**
- **All Sitemaps** (default - shows everything)
- **page-sitemap.xml** (only pages)
- **blog-sitemap.xml** (only blog)
- **product-sitemap.xml** (only products)
- etc...

### How It Works

#### 1. Track Sitemap Source

When parsing nested sitemaps:
```typescript
// Each URL remembers which sitemap it came from
{
  url: "https://reprise.com/blog/post-1",
  sitemapSource: "blog-sitemap.xml"  // ← Tracked!
}
```

#### 2. Store in Firestore

Project document:
```typescript
{
  sitemaps: [
    "page-sitemap.xml",
    "blog-sitemap.xml",
    "product-sitemap.xml"
  ]
}
```

Each node:
```typescript
{
  url: "...",
  sitemapSource: "blog-sitemap.xml",  // Which sitemap
  // ... other fields
}
```

#### 3. Filter on Selection

```typescript
// When user selects a sitemap
if (selectedSitemap !== 'All Sitemaps') {
  filteredNodes = nodes.filter(node => 
    node.data.sitemapSource === selectedSitemap
  );
}
```

### UI Design

**Dropdown Button:**
- Rounded-xl island style (matches other toolbars)
- File icon + sitemap name
- Chevron indicator
- Smooth animations

**Dropdown Menu:**
- Glassmorphic backdrop blur
- Staggered item animations
- Check mark on selected item
- Hover states

### Example Use Case

**Reprise.com** might have:
```
All Sitemaps (200 URLs)
├── page-sitemap.xml (50 URLs)
├── blog_posts-sitemap.xml (80 URLs)
├── products-sitemap.xml (30 URLs)
└── guides-sitemap.xml (40 URLs)
```

**Workflow:**
1. Create project → All sitemaps loaded
2. See dropdown with 4 options + "All Sitemaps"
3. Select "blog_posts-sitemap.xml"
4. **Canvas shows only 80 blog posts!**
5. Switch to "products-sitemap.xml"
6. **Now showing only 30 products!**

---

## Technical Implementation

### Files Changed

**Horizontal Layout:**
- `src/lib/url-hierarchy.ts` - Tree layout algorithm

**Sitemap Tracking:**
- `src/app/api/sitemap/route.ts` - Track source during parsing
- `src/app/api/projects/create/route.ts` - Store source in nodes
- `src/hooks/useRealtimeNodes.ts` - Load source from Firestore

**UI Components:**
- `src/components/canvas/SitemapSelector.tsx` - NEW! Dropdown component
- `src/app/canvas/page.tsx` - Integrate selector
- `src/components/flow/SiteMapFlow.tsx` - Filter nodes

### Data Flow

```
1. Fetch sitemap → Tag each URL with source
2. Create project → Store sitemaps list
3. Create nodes → Include sitemapSource field
4. Load project → Fetch sitemaps list
5. Render dropdown → Show all sitemaps
6. User selects → Filter nodes
7. Canvas updates → Show only matching nodes
```

---

## Console Output

**Project Creation:**
```bash
🔍 Fetching sub-sitemap: page-sitemap.xml
✅ Found 50 URLs in page-sitemap.xml (depth 1)

🔍 Fetching sub-sitemap: blog-sitemap.xml
✅ Found 80 URLs in blog-sitemap.xml (depth 1)

📊 Progress: 130 total URLs from 2 sitemaps
🌲 Hierarchy built: 130 nodes, 129 edges
```

**Sitemap Filtering:**
```bash
🔍 Filtered to 80 nodes from blog-sitemap.xml
🔄 SiteMapFlow: updating nodes: 80 nodes
```

---

## Benefits

### Horizontal Layout

✅ **Easier to read** - Natural left-to-right scanning  
✅ **Better for deep hierarchies** - Grows horizontally not vertically  
✅ **Clearer relationships** - Parent → Child is obvious  
✅ **More familiar** - Like org charts and file trees  

### Sitemap Selector

✅ **Focus on one section** - Blog, products, etc.  
✅ **Reduce overwhelm** - Don't show 200+ nodes at once  
✅ **Understand structure** - See how site is organized  
✅ **Performance** - Fewer nodes = faster rendering  
✅ **Clean UI** - Beautiful dropdown matches design system  

---

## Try It Now!

**Test Horizontal Layout:**
1. Create any project
2. Open canvas
3. **See nodes arranged left-to-right!**
4. Root on left, children spread down and right

**Test Sitemap Selector:**
1. Create project with multiple sitemaps (e.g., `reprise.com`)
2. **Look for dropdown** in top-left toolbar
3. Click dropdown
4. **Select different sitemaps**
5. Watch canvas filter nodes!

---

## Layout Comparison

### Vertical (Old):
```
Level 0:        [A]
                 |
Level 1:    [B] [C] [D]
             |   |
Level 2:    [E] [F]
```
Height grows with depth → Hard to navigate

### Horizontal (New):
```
Level 0     Level 1     Level 2

[A] ────┬─── [B] ────── [E]
        ├─── [C] ────── [F]
        └─── [D]
```
Width grows with depth → Easy to scan!

---

## Design Consistency

**Sitemap Selector matches:**
- Same rounded-xl style as other islands
- Same colors (`#5B98D6`, `#4863B0`)
- Same shadow and blur effects
- Same motion animations
- Same hover states

**Feels native to Atlas!**

---

## Future Enhancements

Potential improvements:

- [ ] Collapse/expand branches
- [ ] Search within sitemap
- [ ] Color-code by sitemap
- [ ] Depth limit slider
- [ ] Export single sitemap
- [ ] Compare sitemaps side-by-side

---

## Performance Notes

**Filtering is Instant:**
- No Firestore queries needed
- Client-side filtering
- Smooth transitions
- React Flow handles updates

**Memory Efficient:**
- All nodes loaded once
- Filter just hides nodes
- Edges update automatically

---

**Your sitemaps are now easy to read (horizontal!) and you can view different sections separately!** 🌳✨

Horizontal layout + sitemap filtering = Professional visual sitemap tool!

