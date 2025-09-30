# Visual Sitemap Explorer - Development Tasks

## Phase 1: Core Setup

### Task 1.1: Scaffold React App
- [ ] Initialize React project with Vite
- [ ] Install React Flow and dependencies
- [ ] Set up basic project structure
- [ ] Configure TypeScript (optional)
- [ ] Set up ESLint and Prettier

### Task 1.2: Firebase Setup
- [ ] Create Firebase project
- [ ] Install Firebase SDK
- [ ] Configure Firebase services (Firestore, Storage, Auth, Hosting)
- [ ] Set up Firebase configuration file
- [ ] Implement basic Firestore connection

## Phase 2: Sitemap Import

### Task 2.1: XML Parser Script
- [ ] Create Node.js script for XML parsing
- [ ] Install fast-xml-parser dependency
- [ ] Implement sitemap URL extraction
- [ ] Parse page metadata (title, description)
- [ ] Handle different sitemap formats

### Task 2.2: Firestore Integration
- [ ] Design Firestore data models
- [ ] Implement node creation in Firestore
- [ ] Add error handling for network issues
- [ ] Implement batch operations for large sitemaps
- [ ] Add data validation

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

## Phase 4: Graph Rendering

### Task 4.1: React Flow Setup
- [ ] Install React Flow dependencies
- [ ] Create basic graph component
- [ ] Implement custom node component
- [ ] Add zoom and pan functionality
- [ ] Implement node selection and editing

### Task 4.2: Custom Node Component
- [ ] Create IframeNode component
- [ ] Implement thumbnail display
- [ ] Add iframe preview functionality
- [ ] Implement toggle between thumbnail and iframe
- [ ] Add node metadata display

### Task 4.3: Position Persistence
- [ ] Implement node position saving
- [ ] Add realtime position updates
- [ ] Handle position conflicts
- [ ] Implement undo/redo functionality
- [ ] Add position validation

## Phase 5: Realtime Collaboration

### Task 5.1: Firestore Listeners
- [ ] Implement realtime node updates
- [ ] Add edge creation and deletion
- [ ] Handle concurrent modifications
- [ ] Implement conflict resolution
- [ ] Add offline support

### Task 5.2: Presence Tracking
- [ ] Implement user presence detection
- [ ] Add live cursor tracking
- [ ] Create user list component
- [ ] Implement user activity indicators
- [ ] Add user permission system

## Phase 6: Hosting + Auth

### Task 6.1: Firebase Hosting
- [ ] Configure Firebase Hosting
- [ ] Set up build and deployment pipeline
- [ ] Implement environment-specific configurations
- [ ] Add custom domain support
- [ ] Implement CDN optimization

### Task 6.2: Authentication
- [ ] Implement Firebase Auth
- [ ] Add Google OAuth integration
- [ ] Create user management system
- [ ] Implement project sharing
- [ ] Add permission-based access control

## Stretch Goals

### Auto-layout
- [ ] Integrate Dagre for automatic layout
- [ ] Implement ELK.js for complex layouts
- [ ] Add layout algorithm selection
- [ ] Implement custom layout options
- [ ] Add layout animation

### Export Functionality
- [ ] Implement PNG export
- [ ] Add PDF export
- [ ] Create export options panel
- [ ] Implement batch export
- [ ] Add export quality settings

### Advanced Features
- [ ] Add page metadata extraction
- [ ] Implement search functionality
- [ ] Add filtering options
- [ ] Create project templates
- [ ] Implement version history
