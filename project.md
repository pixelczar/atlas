# Atlas - Visual Sitemap Explorer

## 🎯 Project Overview

Atlas is a visual sitemap exploration tool with realtime collaboration capabilities. Transform XML sitemaps into interactive, zoomable graphs with live page previews.

## ✨ Key Features

### Core Features
1. **Sitemap Import** - Parse WordPress XML sitemaps and extract URLs
2. **Thumbnail Generation** - Capture page screenshots using Puppeteer
3. **Graph Visualization** - Interactive canvas powered by React Flow
4. **Realtime Collaboration** - Multi-user editing via Firebase Firestore
5. **Live Previews** - Toggle between thumbnails and iframe previews

### Stretch Goals
- Auto-layout algorithms (Dagre/ELK.js)
- Page metadata extraction
- User presence tracking (live cursors)
- Project permissions system
- Export to PNG/PDF
- Dark/light mode

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Graph**: React Flow
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Animation**: Framer Motion
- **Scripts**: Puppeteer, xml2js
- **Deployment**: Vercel

## 📂 Project Structure

```
/src
  /app
    layout.tsx          # Root layout with metadata
    page.tsx            # Homepage
    /canvas             # Graph canvas page
    /dashboard          # Projects dashboard
    /auth               # Authentication page
    globals.css         # Global styles + CSS variables
  /components
    /ui                 # shadcn/ui components
      button.tsx
      card.tsx
      input.tsx
    /flow               # React Flow components
      IframeNode.tsx    # Custom node with thumbnail/iframe
      SiteMapFlow.tsx   # Main graph component
  /lib
    firebase.ts         # Firebase SDK configuration
    utils.ts            # Utility functions (cn)

/scripts
  crawl-sitemap.js      # XML sitemap parser
  screenshot-upload.js  # Puppeteer screenshot generator

/public               # Static assets
/docs                 # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project
- Vercel account (for deployment)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd atlas
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore, Storage, and Authentication
   - Copy Firebase config values
   - Create `.env.local` from `env.example`
   ```bash
   cp env.example .env.local
   ```
   - Fill in your Firebase credentials

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Using Scripts

**Crawl a sitemap:**
```bash
npm run crawl-sitemap https://example.com/wp-sitemap.xml
```

**Generate screenshots:**
```bash
npm run screenshot-upload
```

## 🎨 Features Implemented

### UI Components (shadcn/ui)
- ✅ Button with variants
- ✅ Card components
- ✅ Input fields
- ✅ Dark mode support

### Pages
- ✅ Homepage with hero and features
- ✅ Canvas page with React Flow demo
- ✅ Dashboard with project list
- ✅ Auth page with Google/Email sign-in UI

### React Flow
- ✅ Custom IframeNode component
- ✅ Thumbnail/iframe toggle
- ✅ Zoom, pan, minimap controls
- ✅ Animated edges

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run crawl-sitemap <url>` - Crawl sitemap XML
- `npm run screenshot-upload` - Generate screenshots

### Environment Variables
See `env.example` for required Firebase configuration variables.

## 📋 Development Milestones

**Phase 1: Core Setup** ✅
- Scaffolded Next.js + TypeScript + Tailwind
- Configured Firebase SDK
- Set up shadcn/ui components
- Integrated React Flow

**Phase 2: Sitemap Import** 🚧
- [x] Built crawl-sitemap.js script
- [ ] Integrate with Firebase Firestore
- [ ] Create import UI

**Phase 3: Thumbnail Capture** 🚧
- [x] Built screenshot-upload.js script
- [ ] Integrate Firebase Storage uploads
- [ ] Link thumbnails to nodes

**Phase 4: Graph Rendering** 🚧
- [x] Custom IframeNode component
- [ ] Dynamic node loading from Firestore
- [ ] Node position persistence

**Phase 5: Realtime Collaboration** ⏳
- [ ] Firestore listeners for nodes/edges
- [ ] Concurrent update handling
- [ ] User presence tracking

**Phase 6: Hosting + Auth** ⏳
- [ ] Firebase Auth implementation
- [ ] Google OAuth integration
- [ ] Vercel deployment

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   vercel
   ```

2. **Set environment variables**
   - Add Firebase config in Vercel dashboard
   - Or use Vercel CLI:
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 📝 TODO

- [ ] Implement Firebase Auth integration
- [ ] Add Firestore CRUD operations for projects
- [ ] Implement screenshot upload to Firebase Storage
- [ ] Add realtime collaboration features
- [ ] Implement auto-layout algorithms
- [ ] Add export functionality (PNG/PDF)
- [ ] Implement user presence tracking
- [ ] Add project permissions system

## 📄 License

ISC

## 🤝 Contributing

This is a personal project. Feel free to fork and adapt for your needs!
