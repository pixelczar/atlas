# Visual Sitemap Explorer - Project Documentation

## Project Context

This document contains the complete project context for the Visual Sitemap Explorer, a tool that takes a website sitemap (e.g. WordPress XML), loads each page, and visualizes the site as a zoomable, draggable graph with realtime collaboration.

## Goal

Build a tool that takes a website sitemap (e.g. WordPress XML), loads each page, and visualizes the site as a zoomable, draggable graph. Each page is represented as a node that:
- Shows a **thumbnail screenshot** (fast overview)
- Can be toggled into an **iframe preview** (live view)
- Is positioned on a **React Flow canvas**

The tool should support **realtime collaboration**, allowing multiple users to view/edit the graph at the same time.

## Objectives

- Parse XML sitemaps and load pages as graph nodes
- Display each page as a thumbnail screenshot with optional iframe preview
- Enable realtime collaboration on node positions and toggles
- Store thumbnails in Firebase Storage and graph state in Firestore
- Deploy with Firebase Hosting and optional Auth

## Technology Stack

### Frontend
- React (Next.js or Vite) + React Flow

### Backend / Infra
- Firebase
  - Firestore → graph state + realtime collab
  - Storage → thumbnails (screenshots)
  - Auth (optional, later)
  - Hosting (for deployment)

### Scripts
- Node.js
  - `crawl-sitemap.js` → fetches XML sitemap and extracts URLs
  - `screenshot-upload.js` → Puppeteer script to capture page thumbnails and upload to Storage

## Features

### Core Features

1. **Sitemap Import**
   - Parse WordPress XML sitemap
   - Store pages in Firestore as nodes

2. **Thumbnail Generation**
   - Puppeteer script to generate screenshots
   - Upload to Firebase Storage
   - Save `thumbUrl` reference on each node

3. **Graph Rendering**
   - React Flow with custom nodes (`IframeNode`)
   - Show thumbnail by default, iframe on click
   - Nodes/edges persisted in Firestore

4. **Realtime Collaboration**
   - Firestore sync for nodes + edges
   - Realtime updates on drag/drop, toggles
   - Optional: presence (live cursors, online users)

5. **Deployment**
   - Firebase Hosting
   - (Optional) Firebase Auth for multi-user projects

### Stretch Features
- Auto-layout via Dagre/ELK.js
- Page metadata (title, meta description)
- Project permissions (view-only vs edit)
- Dark/light mode
- Export to PNG/PDF

## Development Milestones

**Phase 1: Core Setup**
- [ ] Scaffold React app in Cursor
- [ ] Initialize Firebase project + `firebase.js`

**Phase 2: Sitemap Import**
- [ ] Build Node script to parse `wp-sitemap.xml`
- [ ] Seed Firestore with page nodes

**Phase 3: Thumbnail Capture**
- [ ] Puppeteer script for screenshots
- [ ] Upload to Firebase Storage

**Phase 4: Graph Rendering**
- [ ] React Flow with `IframeNode`
- [ ] Manual drag + save positions

**Phase 5: Realtime Collaboration**
- [ ] Firestore sync for nodes + edges
- [ ] Presence tracking

**Phase 6: Hosting + Auth**
- [ ] Firebase Hosting deployment
- [ ] Add Google login for project sharing

## Project Structure

```
src/
├── components/
│   ├── IframeNode.jsx      # Custom React Flow node component
│   └── SiteMapFlow.jsx     # Main graph component
├── firebase/
│   └── firebase.js         # Firebase configuration
scripts/
├── crawl-sitemap.js        # XML sitemap parser
└── screenshot-upload.js    # Puppeteer screenshot script
docs/
└── project.md             # This file
```

## Implementation Notes

- Use React Flow for the graph visualization with custom nodes
- Implement realtime collaboration using Firestore listeners
- Store node positions and metadata in Firestore collections
- Use Firebase Storage for thumbnail images with proper CDN caching
- Implement proper error handling for network issues and Firebase limits
