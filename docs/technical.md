# Visual Sitemap Explorer - Technical Specifications

## Development Environment

### Prerequisites
- Node.js 18+ 
- Firebase CLI
- Git

### Package Management
- Use npm for dependency management
- Lock dependencies with package-lock.json

## Technology Stack Details

### Frontend Framework
- **React 18+** with hooks and functional components
- **React Flow** for graph visualization
- **TypeScript** for type safety (optional but recommended)
- **Vite** for build tooling and development server

### Backend Services
- **Firebase Firestore** for realtime database
- **Firebase Storage** for file storage
- **Firebase Auth** for user management
- **Firebase Hosting** for deployment

### Data Processing
- **Puppeteer** for screenshot generation
- **fast-xml-parser** for XML sitemap parsing
- **Node.js** for server-side scripts

## Code Organization

### Component Structure
```
src/
├── components/
│   ├── IframeNode.jsx          # Custom React Flow node
│   ├── SiteMapFlow.jsx         # Main graph component
│   ├── Toolbar.jsx             # Graph controls
│   └── NodePanel.jsx           # Node details panel
├── hooks/
│   ├── useFirestore.js         # Firestore data hooks
│   └── useCollaboration.js     # Realtime collaboration
├── utils/
│   ├── firebase.js             # Firebase configuration
│   └── sitemapParser.js        # XML parsing utilities
└── types/
    └── index.ts                # TypeScript definitions
```

### Scripts Organization
```
scripts/
├── crawl-sitemap.js            # XML sitemap crawler
├── screenshot-upload.js        # Thumbnail generator
└── seed-data.js                # Development data seeding
```

## Development Patterns

### React Patterns
- Use functional components with hooks
- Implement custom hooks for data fetching
- Use React.memo for performance optimization
- Implement error boundaries for error handling

### Firebase Patterns
- Use Firestore security rules for data protection
- Implement offline support with Firestore persistence
- Use Firebase Storage rules for file access control
- Implement proper error handling for network issues

### State Management
- Use React Flow's built-in state management
- Implement Firestore listeners for realtime updates
- Use local state for UI-only data
- Implement optimistic updates for better UX

## Performance Optimizations

### Frontend
- Implement virtual scrolling for large graphs
- Use React.memo for expensive components
- Implement lazy loading for thumbnails
- Use React Flow's built-in performance optimizations

### Backend
- Use Firestore composite indexes for complex queries
- Implement pagination for large datasets
- Use Firebase Storage CDN for image delivery
- Implement proper caching strategies

## Testing Strategy

### Unit Tests
- Test individual components with React Testing Library
- Test custom hooks with proper mocking
- Test utility functions with Jest

### Integration Tests
- Test Firebase integration with test database
- Test React Flow interactions
- Test realtime collaboration features

### End-to-End Tests
- Test complete user workflows
- Test cross-browser compatibility
- Test mobile responsiveness

## Deployment

### Development
- Use Firebase emulators for local development
- Implement hot reloading with Vite
- Use environment variables for configuration

### Production
- Deploy to Firebase Hosting
- Use Firebase Functions for server-side logic
- Implement proper monitoring and logging
- Use Firebase Analytics for usage tracking
