# Hierarchical Sitemap Layout 🌲

## The Big Change

**Before:** Grid layout with no relationship to URL structure  
**After:** Hierarchical tree layout that reflects actual site architecture!

## What It Does

Atlas now analyzes your sitemap URLs and creates a **visual tree diagram** showing how your site is actually structured:

```
reprise.com/
├── blog/
│   ├── post-1
│   ├── post-2
│   └── category/
│       └── article
├── products/
│   ├── demo-library
│   └── analytics
└── about/
    └── team
```

Each level of the URL path becomes a level in the tree, with parent-child connections automatically created!

---

## How It Works

### 1. URL Parsing

Analyzes each URL to extract its path structure:

```typescript
"https://reprise.com/blog/post-1"
  ↓
{
  domain: "reprise.com",
  path: "/blog/post-1",
  segments: ["blog", "post-1"],
  depth: 2
}
```

### 2. Hierarchy Building

Creates parent-child relationships based on URL paths:

```typescript
/blog/post-1  →  parent: /blog
/blog         →  parent: / (root)
/             →  parent: null (root node)
```

### 3. Tree Layout Calculation

Positions nodes in a tree structure:

- **Horizontal**: Nodes at same depth spread horizontally
- **Vertical**: Each depth level gets its own row
- **Spacing**: 350px horizontal, 220px vertical

### 4. Edge Creation

Automatically creates connections between parents and children:

```typescript
/ → /blog
/ → /products
/blog → /blog/post-1
/blog → /blog/post-2
```

---

## Visual Example

### URL Structure:
```
https://reprise.com/
https://reprise.com/blog
https://reprise.com/blog/post-1
https://reprise.com/blog/post-2
https://reprise.com/products
https://reprise.com/products/demo
```

### Rendered Diagram:
```
                    [reprise.com/]
                    /            \
              [blog/]          [products/]
              /     \               |
      [post-1]  [post-2]         [demo]
```

---

## Implementation Details

### New File: `url-hierarchy.ts`

**Functions:**

1. **`parseURL(url)`** - Extract path segments
2. **`buildURLHierarchy(urls)`** - Create tree structure
3. **`calculateTreeLayout(hierarchy)`** - Position nodes
4. **`createHierarchyEdges(hierarchy)`** - Generate connections

### Updated: `projects/create/route.ts`

**Changes:**
- Analyzes sitemap URLs on project creation
- Builds hierarchy tree
- Calculates tree layout positions
- Creates parent-child edges
- Stores depth and path information

### Updated: `SiteMapFlow.tsx`

**Changes:**
- Loads edges from Firestore
- Displays parent-child connections
- Smooth step edges with blue color
- Edges update in real-time

---

## Data Structure

### Node Document
```typescript
{
  id: "firestore-doc-id",
  url: "https://reprise.com/blog/post-1",
  path: "/blog/post-1",
  depth: 2,
  title: "Post 1",
  parentId: "parent-url", // Reference to parent
  position: { x: 450, y: 320 },
  // ... other fields
}
```

### Edge Document
```typescript
{
  id: "edge-id",
  source: "parent-firestore-id",
  target: "child-firestore-id",
  type: "smoothstep",
  animated: false,
  // ... other fields
}
```

---

## Layout Algorithm

### Tree Positioning

```typescript
// Configuration
horizontalSpacing: 350px  // Space between siblings
verticalSpacing: 220px    // Space between levels
startX: 100px             // Left padding
startY: 100px             // Top padding

// Position calculation
x = startX + (horizontalIndex * horizontalSpacing)
y = startY + (depth * verticalSpacing)
```

### Example Positions:

```
Depth 0 (Root):
  Node 1: (100, 100)

Depth 1 (Children of root):
  Node 1: (100, 320)
  Node 2: (450, 320)
  Node 3: (800, 320)

Depth 2 (Grandchildren):
  Node 1: (100, 540)
  Node 2: (450, 540)
  // etc...
```

---

## Edge Styling

All parent-child connections use:

```typescript
{
  type: 'smoothstep',      // Smooth curved lines
  animated: false,         // No animation (cleaner)
  style: {
    stroke: '#4863B0',     // Blue color
    strokeWidth: 2,        // 2px lines
  }
}
```

---

## Benefits

### For Users

✅ **Understand site structure** at a glance  
✅ **See relationships** between pages  
✅ **Navigate hierarchy** visually  
✅ **Identify patterns** in URL structure  
✅ **Spot orphaned pages** (no parent)  

### For Analysis

✅ **Content organization** - See how content is grouped  
✅ **Site depth** - Identify how deep your site goes  
✅ **Navigation structure** - Visualize menu hierarchy  
✅ **SEO insights** - Understand internal linking  

---

## Example Use Cases

### Blog Analysis
```
/ (root)
└── blog/
    ├── category-1/
    │   ├── post-1
    │   └── post-2
    └── category-2/
        └── post-3
```

### E-commerce Site
```
/ (root)
├── products/
│   ├── category-a/
│   │   ├── product-1
│   │   └── product-2
│   └── category-b/
│       └── product-3
└── about/
    └── team
```

### Documentation Site
```
/ (root)
└── docs/
    ├── getting-started/
    │   ├── installation
    │   └── quickstart
    └── api/
        ├── reference
        └── guides
```

---

## Console Output

When creating a project, you'll see:

```bash
📝 Creating hierarchical layout for 50 nodes
🌲 Hierarchy built: 50 nodes, 49 edges
✅ Batch 1 committed (50 nodes)
✅ Created 49 edges
✅ Created project abc123 with 50 nodes
```

In the canvas:

```bash
📊 Firestore snapshot received: 50 documents
🎯 Setting nodes: 50 nodes
📊 Loaded 49 edges
```

---

## Smart Features

### Orphan Handling
If a child's parent doesn't exist in sitemap:
- Attaches to root node
- Prevents disconnected nodes
- Creates logical fallback

### Root Detection
- URLs with path "/" become root nodes
- Multiple roots supported (for complex sites)
- Each gets its own tree

### Depth Tracking
- Stored in each node
- Can filter by depth later
- Useful for collapsing levels

---

## Performance

### Optimizations

- **Batch operations**: 500 nodes per batch
- **Edge limits**: Max 500 edges
- **Efficient mapping**: O(n) hierarchy building
- **Single-pass layout**: Fast positioning

### Scales to:

- ✅ 500 nodes (smooth)
- ✅ 1000 nodes (possible)
- ⚠️ 2000+ nodes (may be slow)

---

## Try It Now!

**Create a new project:**
1. Go to Dashboard
2. Click "New Project"
3. Enter domain (e.g., `reprise.com`)
4. Watch it build the hierarchy!

**What you'll see:**
- Root node at top
- First-level pages spread below
- Sub-pages connected to parents
- Beautiful tree structure!

**Grid button still works:**
- Click Grid to reorganize into tree layout
- Uses viewport-aware spacing
- Maintains hierarchy

---

## Future Enhancements

Potential improvements:

- [ ] Collapsible branches (hide/show sub-trees)
- [ ] Depth-based filtering
- [ ] Different layout algorithms (radial, force-directed)
- [ ] Manual edge creation
- [ ] Breadcrumb navigation
- [ ] Highlight path to selected node

---

## Technical Notes

### Edge Source/Target
- Uses Firestore document IDs
- Created in two-pass approach
- Maps URLs to IDs before edge creation

### Real-time Updates
- Edges load via Firestore listener
- Updates when structure changes
- Smooth transitions

### Hierarchy Persistence
- Stored in node documents
- Depth and path fields
- Preserves relationships

---

**Your sitemaps now show actual site structure - not just a grid!** 🌲✨

