# Visual Sitemap Explorer - Development Tasks

## Phase 1: Core Setup ✅

### Task 1.1: Scaffold React App ✅
- [x] Initialize Next.js 15 project with App Router
- [x] Install React Flow and dependencies
- [x] Set up basic project structure
- [x] Configure TypeScript
- [x] Set up ESLint and Prettier
- [x] Configure Tailwind CSS with custom design system

### Task 1.2: Firebase Setup ✅
- [x] Create Firebase project
- [x] Install Firebase SDK
- [x] Configure Firebase services (Firestore, Storage, Auth, Hosting)
- [x] Set up Firebase configuration file
- [x] Implement basic Firestore connection
- [x] Set up Firestore security rules

## Phase 2: Sitemap Import ✅

### Task 2.1: XML Parser Script ✅
- [x] Create API route for XML parsing (`/api/sitemap`)
- [x] Install fast-xml-parser dependency
- [x] Implement sitemap URL extraction
- [x] Parse page metadata (title, description)
- [x] Handle different sitemap formats
- [x] Support nested sitemap indexes (up to 3 levels)
- [x] Parallel fetching of multiple sitemaps

### Task 2.2: Firestore Integration ✅
- [x] Design Firestore data models (Project, Node, Edge)
- [x] Implement node creation in Firestore
- [x] Add error handling for network issues
- [x] Implement batch operations for large sitemaps (500 node limit)
- [x] Add data validation
- [x] Implement hierarchical URL structure with parent-child relationships

## Phase 3: Thumbnail Capture

### Task 3.1: Puppeteer Setup
- [ ] Install Puppeteer dependency
- [ ] Create screenshot generation script
- [ ] Implement URL validation
- [ ] Add error handling for failed screenshots
- [ ] Optimize screenshot quality and size

### Task 3.2: Firebase Storage Integration
- [ ] Configure Firebase Storage
- [ ] Implement image upload functionality
- [ ] Generate unique file names
- [ ] Update Firestore with image URLs
- [ ] Implement retry logic for failed uploads

## Phase 3: Advanced Visualization & Layout Algorithms ✅

### Task 3.1: Layout Algorithms ✅
- [x] Implement Grid layout algorithm
- [x] Implement Tree layout with Dagre (top-to-bottom)
- [x] Implement Dagre layout with network-simplex ranker
- [x] Add layout switching functionality
- [x] Implement sibling clustering for better grouping
- [x] Add auto-centering on home page
- [x] Implement curved edges with smoothstep type

### Task 3.2: React Flow Integration ✅
- [x] Install React Flow dependencies
- [x] Create SiteMapFlow component
- [x] Implement custom IframeNode component
- [x] Add zoom and pan functionality
- [x] Implement node selection and editing
- [x] Add mouse wheel zoom as default behavior

### Task 3.3: Custom Node Component ✅
- [x] Create IframeNode component with full URL display
- [x] Implement thumbnail display (placeholder)
- [x] Add iframe preview functionality
- [x] Implement toggle between thumbnail and iframe
- [x] Add node metadata display
- [x] Implement search highlighting
- [x] Add visual feedback for selection and hover states

### Task 3.4: Position Persistence ✅
- [x] Implement node position saving to Firestore
- [x] Add realtime position updates
- [x] Handle position conflicts
- [x] Add position validation
- [x] Implement smooth node dragging

## Phase 4: User Interface & Navigation ✅

### Task 4.1: Project Management UI ✅
- [x] Create ProjectSidebar component with slide-out animation
- [x] Implement project CRUD operations
- [x] Add project list with staggered animations
- [x] Implement project selection and navigation
- [x] Add project metadata display (URL, page count)

### Task 4.2: Navigation & Breadcrumbs ✅
- [x] Create Breadcrumb component with interactive navigation
- [x] Implement sitemap selector in breadcrumb
- [x] Add "Pages" dropdown with search functionality
- [x] Implement page visibility toggles with localStorage persistence
- [x] Add search highlighting in the diagram

### Task 4.3: Floating Controls & Toolbars ✅
- [x] Create FloatingControls component with island design
- [x] Implement layout switcher (Grid, Tree, Dagre)
- [x] Add sitemap selector in floating controls
- [x] Create SelectionToolbar for contextual actions
- [x] Implement smooth animations and transitions

## Phase 5: Realtime Collaboration ✅

### Task 5.1: Firestore Listeners ✅
- [x] Implement realtime node updates via useRealtimeNodes
- [x] Add realtime edge updates via useRealtimeEdges
- [x] Handle concurrent modifications
- [x] Implement conflict resolution
- [x] Add offline support with Firestore persistence

### Task 5.2: User Experience ✅
- [x] Implement smooth loading animations
- [x] Add Framer Motion transitions throughout UI
- [x] Create responsive design with compact spacing
- [x] Implement visual feedback for all interactions
- [x] Add search and filtering capabilities

## Phase 6: Screenshot Generation 🚧

### Task 6.1: Screenshot API Integration
- [ ] Integrate screenshot API for node thumbnails
- [ ] Generate thumbnails for sitemap URLs
- [ ] Display thumbnails in nodes
- [ ] Implement thumbnail caching and optimization
- [ ] Add fallback for failed screenshots

### Task 6.2: Thumbnail Management
- [ ] Implement thumbnail storage in Firebase Storage
- [ ] Add thumbnail generation queue system
- [ ] Create thumbnail optimization pipeline
- [ ] Implement lazy loading for thumbnails
- [ ] Add thumbnail refresh functionality

## Phase 7: Firebase Authentication 🚧

### Task 7.1: Authentication System
- [ ] Implement Firebase Auth
- [ ] Add Google OAuth integration
- [ ] Create user management system
- [ ] Implement project sharing
- [ ] Add permission-based access control

### Task 7.2: User Management
- [ ] Create user profile system
- [ ] Implement project ownership
- [ ] Add user activity tracking
- [ ] Create user preferences
- [ ] Implement user settings

## Phase 8: Hosting + Deployment 🚧

### Task 8.1: Firebase Hosting
- [ ] Configure Firebase Hosting
- [ ] Set up build and deployment pipeline
- [ ] Implement environment-specific configurations
- [ ] Add custom domain support
- [ ] Implement CDN optimization

## Stretch Goals

### Advanced Layout Features ✅
- [x] Integrate Dagre for automatic layout
- [x] Add layout algorithm selection (Grid, Tree, Dagre)
- [x] Implement custom layout options
- [x] Add layout animation and transitions
- [ ] Implement ELK.js for complex layouts
- [ ] Add custom layout presets

### Export Functionality 🚧
- [ ] Implement PNG export
- [ ] Add PDF export
- [ ] Create export options panel
- [ ] Implement batch export
- [ ] Add export quality settings
- [ ] Implement SVG export

### Advanced Features 🚧
- [x] Implement search functionality with highlighting
- [x] Add filtering options (page visibility)
- [ ] Add page metadata extraction (title, description, keywords)
- [ ] Create project templates
- [ ] Implement version history and snapshots
- [ ] Add advanced analytics and insights
