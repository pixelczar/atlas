# Atlas - Quick Start Guide

> 🚀 **Production-ready Next.js + Firebase visual sitemap explorer**

## ⚡ Get Started in 3 Steps

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Configure Firebase

```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your Firebase credentials
```

Get your Firebase config from [console.firebase.google.com](https://console.firebase.google.com)

### 3️⃣ Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

---

## 📋 What's Included

### ✅ Framework & Tools
- **Next.js 15** - App Router, TypeScript, Server Components
- **Tailwind CSS** - Dark mode, responsive design
- **shadcn/ui** - Beautiful, accessible components
- **React Flow** - Interactive graph visualization
- **Firebase** - Firestore, Storage, Auth ready
- **Framer Motion** - Smooth animations

### ✅ Pages Built
- **Homepage** (`/`) - Hero + features
- **Canvas** (`/canvas`) - React Flow demo with custom nodes
- **Dashboard** (`/dashboard`) - Project list
- **Auth** (`/auth`) - Sign in UI (Google + Email)

### ✅ Components
- `IframeNode.tsx` - Custom node with thumbnail/iframe toggle
- `SiteMapFlow.tsx` - Main graph component
- UI components: Button, Card, Input (shadcn/ui)

### ✅ Scripts
- `crawl-sitemap.js` - Parse XML sitemaps
- `screenshot-upload.js` - Generate page screenshots

---

## 🎯 Key Features

### Current Implementation
- ✅ Interactive graph with zoom/pan
- ✅ Custom nodes with thumbnail display
- ✅ Toggle between thumbnail and iframe preview
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Firebase SDK configured

### Ready to Implement
- 🚧 Firebase Authentication (Google OAuth)
- 🚧 Firestore data persistence
- 🚧 Screenshot upload to Storage
- 🚧 Realtime collaboration
- 🚧 Auto-layout algorithms

---

## 🛠️ Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Sitemap Tools
npm run crawl-sitemap https://example.com/sitemap.xml
npm run screenshot-upload
```

---

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/atlas)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... add other Firebase vars

# Deploy to production
vercel --prod
```

---

## 📁 Project Structure

```
atlas/
├── src/
│   ├── app/                    # Pages
│   │   ├── page.tsx           # Homepage
│   │   ├── canvas/            # Graph canvas
│   │   ├── dashboard/         # Projects
│   │   └── auth/              # Sign in
│   ├── components/
│   │   ├── ui/                # shadcn/ui
│   │   └── flow/              # React Flow
│   └── lib/
│       ├── firebase.ts        # Firebase config
│       └── utils.ts           # Utilities
├── scripts/
│   ├── crawl-sitemap.js       # XML parser
│   └── screenshot-upload.js   # Screenshots
└── docs/                      # Documentation
```

---

## 🔥 Firebase Setup

1. **Create Project** at [console.firebase.google.com](https://console.firebase.google.com)

2. **Enable Services**
   - Firestore Database (test mode)
   - Storage (test mode)
   - Authentication (Google provider)

3. **Get Config** from Project Settings → General

4. **Add to `.env.local`**

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions
- **[project.md](./project.md)** - Complete project overview
- **[docs/](./docs/)** - Architecture & technical specs

---

## 🎨 Customization

### Update Theme

Edit `src/app/globals.css` for color scheme:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Blue */
  /* ... customize colors */
}
```

### Add Components

```bash
# shadcn/ui components available for addition
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
```

### Modify Graph

Edit `src/components/flow/SiteMapFlow.tsx` for graph behavior

---

## 🐛 Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Firebase Not Working
- Check `.env.local` variables
- Verify Firebase project is active
- Check console for errors

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## 🤝 Next Steps

1. **Configure Firebase** - Add your credentials
2. **Customize Design** - Update colors and styles
3. **Implement Auth** - Add Firebase authentication
4. **Add Firestore** - Connect database
5. **Deploy** - Push to Vercel

---

## 📖 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Flow](https://reactflow.dev)
- [Firebase](https://firebase.google.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Built with ❤️ using Next.js, Firebase, and React Flow**
