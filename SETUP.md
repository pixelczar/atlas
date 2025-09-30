# Atlas - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable the following services:
   - **Firestore Database** (Start in test mode for development)
   - **Firebase Storage** (Start in test mode for development)
   - **Authentication** (Enable Google provider)

3. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Copy the config values

4. Create `.env.local` file:

```bash
cp env.example .env.local
```

5. Fill in your Firebase credentials in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
atlas/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   ├── auth/               # Authentication
│   │   ├── canvas/             # Graph canvas
│   │   └── dashboard/          # Project dashboard
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   └── flow/               # React Flow components
│   │       ├── IframeNode.tsx  # Custom node component
│   │       └── SiteMapFlow.tsx # Main graph
│   └── lib/
│       ├── firebase.ts         # Firebase config
│       └── utils.ts            # Utilities
├── scripts/
│   ├── crawl-sitemap.js        # Sitemap crawler
│   └── screenshot-upload.js    # Screenshot generator
├── public/                     # Static files
├── docs/                       # Documentation
└── tasks/                      # Task tracking
```

## 🛠️ Available Scripts

### Development
```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run format      # Format with Prettier
```

### Sitemap Tools
```bash
# Crawl a sitemap
npm run crawl-sitemap https://example.com/wp-sitemap.xml

# Generate screenshots (requires urls.json from crawl)
npm run screenshot-upload
```

## 🎨 Features

### Implemented ✅
- Next.js 15 with App Router and TypeScript
- Tailwind CSS with dark mode
- shadcn/ui components (Button, Card, Input)
- React Flow integration with custom nodes
- Firebase SDK setup
- Sitemap crawler script
- Screenshot generator script
- Responsive layouts
- SEO-optimized

### To Implement 🚧
- Firebase Authentication integration
- Firestore CRUD operations
- Firebase Storage uploads
- Realtime collaboration
- Auto-layout algorithms
- Export functionality

## 🔥 Firebase Setup Details

### Firestore Collections

Create these collections manually or they will be auto-created:

```
projects/
  - id: string
  - name: string
  - sitemapUrl: string
  - createdAt: timestamp
  - ownerId: string

nodes/
  - id: string
  - projectId: string
  - url: string
  - title: string
  - thumbnailUrl: string
  - position: { x: number, y: number }

edges/
  - id: string
  - projectId: string
  - source: string
  - target: string
```

### Storage Structure

```
/projects/{projectId}/screenshots/{nodeId}.png
```

### Security Rules

For development, use test mode. For production:

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.ownerId;
    }
    match /nodes/{nodeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /edges/{edgeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   
   In Vercel dashboard or via CLI:
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Alternative: GitHub Integration

1. Push code to GitHub
2. Connect repository in Vercel dashboard
3. Add environment variables in Vercel project settings
4. Deploy automatically on push

## 🐛 Troubleshooting

### Build Errors

**Tailwind CSS PostCSS error:**
- Ensure `tailwindcss@^3.4.1` is installed
- Check `postcss.config.mjs` configuration

**Firebase not initialized:**
- Verify `.env.local` has all required variables
- Check Firebase config in `src/lib/firebase.ts`

### Development Issues

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Node modules issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Implement Authentication**
   - Add Google OAuth provider in Firebase Console
   - Implement sign-in logic in `src/app/auth/page.tsx`

2. **Connect Firestore**
   - Create hooks for projects CRUD
   - Implement realtime listeners

3. **Upload Screenshots**
   - Modify `screenshot-upload.js` to use Firebase Admin SDK
   - Upload to Firebase Storage

4. **Build Collaboration**
   - Add Firestore listeners for nodes/edges
   - Implement presence tracking

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Flow Docs](https://reactflow.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
