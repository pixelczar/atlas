# Visual Sitemap Explorer - Architecture

## System Overview

The Visual Sitemap Explorer is a realtime collaborative web application that visualizes website sitemaps as interactive graphs. The system consists of a React frontend, Firebase backend services, and Node.js scripts for data processing.

## Architecture Components

### Frontend (React + React Flow)
- **SiteMapFlow.jsx**: Main graph component using React Flow
- **IframeNode.jsx**: Custom node component with thumbnail/iframe toggle
- **Firebase Integration**: Real-time data synchronization

### Backend (Firebase)
- **Firestore**: Document database for nodes, edges, and user data
- **Storage**: Blob storage for thumbnail images
- **Auth**: User authentication and authorization
- **Hosting**: Static site hosting

### Data Processing (Node.js)
- **crawl-sitemap.js**: XML sitemap parser
- **screenshot-upload.js**: Puppeteer-based thumbnail generation

## Data Flow

1. **Sitemap Import**: XML sitemap → Node.js parser → Firestore nodes
2. **Thumbnail Generation**: URLs → Puppeteer → Firebase Storage → Firestore URLs
3. **Graph Rendering**: Firestore → React Flow → Interactive visualization
4. **Realtime Sync**: User actions → Firestore → All connected clients

## Data Models

### Firestore Collections

#### `projects`
```javascript
{
  id: string,
  name: string,
  sitemapUrl: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  ownerId: string
}
```

#### `nodes`
```javascript
{
  id: string,
  projectId: string,
  url: string,
  title: string,
  thumbnailUrl: string,
  position: { x: number, y: number },
  metadata: {
    description: string,
    lastModified: timestamp
  }
}
```

#### `edges`
```javascript
{
  id: string,
  projectId: string,
  source: string, // node id
  target: string, // node id
  type: string
}
```

## Security Rules

- Users can only access projects they own or have been shared
- Node and edge data is scoped to project access
- Thumbnail URLs are publicly readable but upload requires authentication

## Performance Considerations

- Implement virtual scrolling for large graphs
- Use Firebase Storage CDN for thumbnail delivery
- Optimize Firestore queries with proper indexing
- Implement offline support with local caching
