# Atlas - Visual Sitemap Explorer

A tool that takes a website sitemap (e.g. WordPress XML), loads each page, and visualizes the site as a zoomable, draggable graph with realtime collaboration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with your Firebase credentials
# See "Environment Variables" section below

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Create a `.env.local` file in the root directory with the following:

```bash
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Screenshot API (Optional - for production)
# Get a free API key at https://screenshotone.com
# Without this: local dev uses Puppeteer, production uses placeholder images
SCREENSHOT_API_KEY=your-screenshot-api-key
```

## Overview

Each page is represented as a node that:
- Shows a **thumbnail screenshot** (fast overview)
- Can be toggled into an **iframe preview** (live view)
- Is positioned on a **React Flow canvas**

The tool supports **realtime collaboration**, allowing multiple users to view/edit the graph at the same time.

## Technology Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + @tailwindcss/forms + @tailwindcss/typography
- **UI Library**: shadcn/ui (Button, Card, Input)
- **Graph**: React Flow
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Animation**: Framer Motion
- **Deployment**: Vercel
- **Scripts**: Node.js
  - `crawl-sitemap.js` → fetches XML sitemap and extracts URLs
  - `screenshot-upload.js` → Puppeteer script to capture page thumbnails

## Core Features

1. **Sitemap Import**
   - Parse WordPress XML sitemap
   - Store pages in Firestore as nodes

2. **Thumbnail Generation**
   - Real-time screenshot capture when adding nodes
   - Uses Screenshot API in production (optional)
   - Falls back to Puppeteer in local dev
   - Final fallback to placeholder images
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

## Stretch Features

- Auto-layout via Dagre/ELK.js
- Page metadata (title, meta description)
- Project permissions (view-only vs edit)
- Dark/light mode
- Export to PNG/PDF

## Project Structure

```
src/
├── components/
│   ├── IframeNode.jsx
│   └── SiteMapFlow.jsx
├── firebase/
│   └── firebase.js
scripts/
├── crawl-sitemap.js
└── screenshot-upload.js
docs/
└── project.md
```

## Development Milestones

**Phase 1: Core Setup**
- Scaffold React app in Cursor
- Initialize Firebase project + `firebase.js`

**Phase 2: Sitemap Import**
- Build Node script to parse `wp-sitemap.xml`
- Seed Firestore with page nodes

**Phase 3: Thumbnail Capture**
- Puppeteer script for screenshots
- Upload to Firebase Storage

**Phase 4: Graph Rendering**
- React Flow with `IframeNode`
- Manual drag + save positions

**Phase 5: Realtime Collaboration**
- Firestore sync for nodes + edges
- Presence tracking

**Phase 6: Hosting + Auth**
- Firebase Hosting deployment
- Add Google login for project sharing
