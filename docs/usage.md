# Atlas - Usage Guide

## Getting Started

### Creating Your First Project

1. **Navigate to Dashboard**
   - Open Atlas and go to the Dashboard page
   - Click the "New Project" button

2. **Enter Domain**
   - In the modal, enter a domain (e.g., `example.com`)
   - No need to include `http://` or `https://`
   - Atlas will automatically check for `sitemap.xml`

3. **Review Sitemap**
   - Atlas tries these common sitemap locations:
     - `sitemap.xml`
     - `sitemap_index.xml`
     - `wp-sitemap.xml` (WordPress)
   - **Nested Sitemap Support**: If the sitemap is an index (contains links to other sitemaps), Atlas will:
     - Automatically fetch all sub-sitemaps
     - Parse all nested URLs (up to 3 levels deep)
     - Aggregate all pages into one project
   - Preview shows the first 10 URLs found
   - You'll see the total count of pages
   - If more than 500 URLs, only first 500 will be added

4. **Create Project**
   - Optionally edit the project name
   - Click "Create Project"
   - Atlas will:
     - Create a Firestore project document
     - Generate nodes for each URL (up to 100)
     - Arrange them in a simple grid layout
     - Redirect you to the canvas

### Working with the Canvas

**Navigation:**
- **Pan**: Click and drag the background
- **Zoom**: Scroll wheel or use floating controls
- **Select**: Click on nodes

**Node Controls:**
- **Move**: Drag nodes to reposition
- **Delete**: Select node and use delete button
- **Toggle View**: Click thumbnail to switch to iframe preview

**Floating Controls (bottom-right):**
- **Fit View**: Center and fit all nodes on screen
- **Re-grid**: Auto-arrange all nodes in a grid
- **Zoom In/Out**: Control zoom level
- **Hide/Show**: Toggle visibility of selected nodes

### Managing Projects

**Dashboard Features:**
- View all your projects
- See page count for each project
- Click a project card to open its canvas
- Real-time updates when projects are added

## Data Structure

### Firestore Collections

```
projects/
  {projectId}/
    - name: "Example Site"
    - domain: "example.com"
    - sitemapUrl: "https://example.com/sitemap.xml"
    - urlCount: 42
    - createdAt: timestamp
    - updatedAt: timestamp
    
    nodes/
      {nodeId}/
        - url: "https://example.com/page"
        - thumbUrl: null (populated later)
        - position: { x: 300, y: 200 }
        - showIframe: false
        - metadata: { status: "pending" }
```

## API Endpoints

### POST /api/sitemap
Fetch and parse sitemap from a domain.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "sitemapUrl": "https://example.com/sitemap.xml",
  "urlCount": 42,
  "urls": [...],
  "totalUrls": 42
}
```

### POST /api/projects/create
Create a new project with sitemap data.

**Request:**
```json
{
  "name": "My Site",
  "domain": "example.com",
  "sitemapUrl": "https://example.com/sitemap.xml",
  "urls": [...]
}
```

**Response:**
```json
{
  "success": true,
  "projectId": "abc123",
  "nodeCount": 42,
  "message": "Project created with 42 pages"
}
```

## Keyboard Shortcuts

- **Delete**: Delete selected nodes
- **Cmd/Ctrl + A**: Select all nodes
- **Escape**: Deselect all

## Tips & Best Practices

1. **Large Sitemaps**: Currently limited to 100 URLs per project for performance
2. **Manual Layout**: Drag nodes to create your preferred layout
3. **Re-grid**: Use re-grid to reset to automatic grid layout
4. **Real-time Sync**: Changes are automatically saved to Firestore
5. **Multiple Users**: Multiple people can view/edit the same project simultaneously

## Troubleshooting

**No sitemap found:**
- Verify the domain is accessible
- Check if the site has a sitemap.xml
- Try the full sitemap URL instead

**Nodes not loading:**
- Check Firebase configuration in `.env.local`
- Verify Firestore is enabled in Firebase console
- Check browser console for errors

**Canvas performance:**
- Reduce number of visible nodes
- Use hide/show feature for large projects
- Consider creating multiple smaller projects

## Next Features

Coming soon:
- Screenshot thumbnails for all pages
- User authentication and project ownership
- Advanced auto-layout algorithms
- Export to PNG/PDF
- Page metadata display
- Search and filter nodes

