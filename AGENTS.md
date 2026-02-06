# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Atlas is a visual sitemap exploration tool that transforms XML sitemaps into interactive, zoomable graphs with real-time collaboration. Built with Next.js 15 (App Router), React Flow, and Firebase.

## Commands

```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run format           # Prettier formatting

# Sitemap utilities
npm run crawl-sitemap <url>    # Parse XML sitemap and extract URLs
npm run screenshot-upload      # Generate page screenshots with Puppeteer
```

## Architecture

### Route Structure (`src/app/`)
- `/` - Landing page with domain input and project creation
- `/canvas` - Main graph visualization canvas (React Flow)
- `/dashboard` - Project list/management
- `/auth` - Authentication UI
- `/api/` - API routes for screenshots, sitemap parsing, image proxy, og-images

### Core Components (`src/components/`)
- `flow/SiteMapFlow.tsx` - Main React Flow wrapper, handles Firestore sync for nodes/edges
- `flow/IframeNode.tsx` - Custom React Flow node with thumbnail/iframe toggle
- `canvas/` - Canvas UI: breadcrumb, floating controls, selection toolbar, sidebar, preview panel
- `ui/` - shadcn/ui primitives (Button, Card, Input, Tooltip)

### Library (`src/lib/`)
- `firebase.ts` - Firebase SDK initialization (Firestore, Storage, Auth)
- `layout-algorithms.ts` - Layout types: `grid`, `depth-columns`, `radial`, `force`, `tree`, `dagre`, `elk`
- `improved-layout-algorithms.ts` - Enhanced dagre/ELK implementations
- `url-hierarchy.ts` - Parses sitemap URLs into hierarchical tree structure
- `node-operations.ts` - CRUD operations for graph nodes
- `firestore-sync.ts` - Real-time Firestore synchronization

### Hooks (`src/hooks/`)
- `useRealtimeNodes.ts` - Real-time Firestore listener for nodes
- `useRealtimeGraph.ts` - Combined nodes/edges sync
- `usePresence.ts` - User presence tracking (cursors, online status)
- `useHighResIcon.ts` - Favicon fetching with fallback chain
- `useDominantColor.ts` - Extract dominant color from images

### Types (`src/types/`)
- `firestore.ts` - Firestore document types: `Project`, `FirestoreNode`, `FirestoreEdge`, `UserPresence`
- `reactflow.ts` - React Flow types: `IframeNodeData`, `SitemapNode`, `SitemapEdge`

## Data Model

Projects are stored in Firestore:
```
projects/{projectId}
  ├── nodes/{nodeId}     # Page nodes with position, URL, thumbnail
  └── edges/{edgeId}     # Connections between pages
```

Each node contains: `url`, `thumbUrl`, `position: {x, y}`, `showIframe`, `title`, `parentId`, `metadata`

## Key Patterns

- **Node positions** are persisted to Firestore on drag; use `writeBatch` for bulk updates
- **Layout algorithms** compute positions from URL hierarchy depth; pass nodes through `applyLayout(nodes, layoutType)`
- **Thumbnail generation** uses Screenshot API in production, Puppeteer locally, placeholder as fallback
- **Real-time sync** uses Firestore `onSnapshot` listeners in custom hooks

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
SCREENSHOT_API_KEY  # Optional, for production screenshots
```
