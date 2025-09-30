# Atlas - Firestore Schema & React Flow Collaboration Model

## 📊 Firestore Collections Structure

### Collection Hierarchy

```
firestore/
├── projects/{projectId}
│   ├── name: string
│   ├── sitemapUrl: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── ownerId: string
│   ├── settings: {
│   │   ├── autoLayout: boolean
│   │   ├── theme: "light" | "dark"
│   │   └── showMinimap: boolean
│   │   }
│   │
│   ├── nodes/{nodeId}
│   │   ├── id: string
│   │   ├── url: string
│   │   ├── thumbUrl: string | null
│   │   ├── position: { x: number, y: number }
│   │   ├── showIframe: boolean
│   │   ├── title: string | null
│   │   ├── description: string | null
│   │   ├── parentId: string | null
│   │   ├── metadata: {
│   │   │   ├── lastModified: timestamp
│   │   │   ├── status: "pending" | "ready" | "error"
│   │   │   ├── screenshotAt: timestamp | null
│   │   │   └── updatedBy: string
│   │   │   }
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   │
│   ├── edges/{edgeId}
│   │   ├── id: string
│   │   ├── source: string (nodeId)
│   │   ├── target: string (nodeId)
│   │   ├── label: string | null
│   │   ├── type: "default" | "smoothstep" | "step"
│   │   ├── animated: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   │
│   └── presence/{userId}
│       ├── userId: string
│       ├── name: string
│       ├── email: string
│       ├── photoURL: string | null
│       ├── cursor: { x: number, y: number } | null
│       ├── color: string (hex)
│       ├── currentNode: string | null
│       ├── lastSeen: timestamp
│       └── isActive: boolean
```

---

## 🎯 TypeScript Type Definitions

### Core Types

```typescript
// types/firestore.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Project Document
 * Top-level collection for sitemap projects
 */
export interface Project {
  id: string;
  name: string;
  sitemapUrl: string;
  ownerId: string;
  settings: {
    autoLayout: boolean;
    theme: 'light' | 'dark';
    showMinimap: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Node Document
 * Represents a page in the sitemap
 * Maps to React Flow node
 */
export interface FirestoreNode {
  id: string;
  url: string;
  thumbUrl: string | null; // Firebase Storage URL
  position: {
    x: number;
    y: number;
  };
  showIframe: boolean; // Toggle between thumbnail and iframe
  title: string | null; // Page title from metadata
  description: string | null; // Meta description
  parentId: string | null; // For hierarchical sitemaps
  metadata: {
    lastModified: Timestamp;
    status: 'pending' | 'ready' | 'error';
    screenshotAt: Timestamp | null;
    updatedBy: string; // userId of last editor
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Edge Document
 * Represents connections between pages
 * Maps to React Flow edge
 */
export interface FirestoreEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  label: string | null; // Link text or description
  type: 'default' | 'smoothstep' | 'step';
  animated: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Presence Document
 * Tracks active users and their cursors
 */
export interface UserPresence {
  userId: string;
  name: string;
  email: string;
  photoURL: string | null;
  cursor: {
    x: number;
    y: number;
  } | null;
  color: string; // User's cursor color (hex)
  currentNode: string | null; // Node being viewed/edited
  lastSeen: Timestamp;
  isActive: boolean;
}
```

### React Flow Integration Types

```typescript
// types/reactflow.ts

import { Node, Edge } from 'reactflow';

/**
 * Custom Node Data for React Flow
 * Extends Firestore node data with UI state
 */
export interface IframeNodeData {
  // From Firestore
  url: string;
  thumbUrl: string | null;
  showIframe: boolean;
  title: string | null;
  description: string | null;
  parentId: string | null;
  
  // UI-specific
  isLoading?: boolean;
  hasError?: boolean;
  lastUpdatedBy?: string;
}

/**
 * React Flow Node with custom data
 */
export type SitemapNode = Node<IframeNodeData>;

/**
 * React Flow Edge with optional label
 */
export type SitemapEdge = Edge<{ label?: string }>;

/**
 * Graph State
 */
export interface GraphState {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  isLoading: boolean;
  error: string | null;
}
```

---

## 🔄 Realtime Sync Implementation

### Firestore to React Flow Converter

```typescript
// lib/firestore-sync.ts

import { doc, collection, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreNode, FirestoreEdge } from '@/types/firestore';
import type { SitemapNode, SitemapEdge } from '@/types/reactflow';

/**
 * Convert Firestore node to React Flow node
 */
export function firestoreNodeToReactFlow(
  firestoreNode: FirestoreNode
): SitemapNode {
  return {
    id: firestoreNode.id,
    type: 'iframeNode', // Custom node type
    position: firestoreNode.position,
    data: {
      url: firestoreNode.url,
      thumbUrl: firestoreNode.thumbUrl,
      showIframe: firestoreNode.showIframe,
      title: firestoreNode.title,
      description: firestoreNode.description,
      parentId: firestoreNode.parentId,
      lastUpdatedBy: firestoreNode.metadata.updatedBy,
    },
    // React Flow specific
    draggable: true,
    selectable: true,
  };
}

/**
 * Convert Firestore edge to React Flow edge
 */
export function firestoreEdgeToReactFlow(
  firestoreEdge: FirestoreEdge
): SitemapEdge {
  return {
    id: firestoreEdge.id,
    source: firestoreEdge.source,
    target: firestoreEdge.target,
    type: firestoreEdge.type,
    animated: firestoreEdge.animated,
    label: firestoreEdge.label || undefined,
    data: {
      label: firestoreEdge.label || undefined,
    },
  };
}

/**
 * Convert React Flow node back to Firestore format
 */
export function reactFlowNodeToFirestore(
  node: SitemapNode,
  userId: string
): Partial<FirestoreNode> {
  return {
    id: node.id,
    position: node.position,
    showIframe: node.data.showIframe,
    metadata: {
      updatedBy: userId,
      lastModified: Timestamp.now(),
      status: node.data.thumbUrl ? 'ready' : 'pending',
      screenshotAt: null,
    },
    updatedAt: Timestamp.now(),
  };
}
```

### Realtime Subscription Hook

```typescript
// hooks/useRealtimeGraph.ts

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { firestoreNodeToReactFlow, firestoreEdgeToReactFlow } from '@/lib/firestore-sync';
import type { SitemapNode, SitemapEdge } from '@/types/reactflow';
import type { FirestoreNode, FirestoreEdge } from '@/types/firestore';

/**
 * Subscribe to realtime graph updates from Firestore
 * 
 * @param projectId - The project ID to subscribe to
 * @returns Graph state with nodes and edges
 */
export function useRealtimeGraph(projectId: string) {
  const [nodes, setNodes] = useState<SitemapNode[]>([]);
  const [edges, setEdges] = useState<SitemapEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // Subscribe to nodes
    const nodesQuery = query(
      collection(db, `projects/${projectId}/nodes`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeNodes = onSnapshot(
      nodesQuery,
      (snapshot) => {
        const updatedNodes: SitemapNode[] = [];
        
        snapshot.forEach((doc) => {
          const firestoreNode = { 
            id: doc.id, 
            ...doc.data() 
          } as FirestoreNode;
          updatedNodes.push(firestoreNodeToReactFlow(firestoreNode));
        });

        setNodes(updatedNodes);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error subscribing to nodes:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Subscribe to edges
    const edgesQuery = query(
      collection(db, `projects/${projectId}/edges`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeEdges = onSnapshot(
      edgesQuery,
      (snapshot) => {
        const updatedEdges: SitemapEdge[] = [];
        
        snapshot.forEach((doc) => {
          const firestoreEdge = { 
            id: doc.id, 
            ...doc.data() 
          } as FirestoreEdge;
          updatedEdges.push(firestoreEdgeToReactFlow(firestoreEdge));
        });

        setEdges(updatedEdges);
      },
      (err) => {
        console.error('Error subscribing to edges:', err);
        setError(err.message);
      }
    );

    // Cleanup subscriptions
    return () => {
      unsubscribeNodes();
      unsubscribeEdges();
    };
  }, [projectId]);

  return { nodes, edges, isLoading, error };
}
```

### Update Node Position (Drag Handler)

```typescript
// lib/graph-operations.ts

import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NodeChange } from 'reactflow';

/**
 * Update node position in Firestore
 * Uses optimistic updates with timestamp-based conflict resolution
 * 
 * @param projectId - Project ID
 * @param nodeId - Node ID to update
 * @param position - New position { x, y }
 * @param userId - Current user ID
 */
export async function updateNodePosition(
  projectId: string,
  nodeId: string,
  position: { x: number; y: number },
  userId: string
) {
  const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);
  
  try {
    await updateDoc(nodeRef, {
      position,
      'metadata.updatedBy': userId,
      'metadata.lastModified': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating node position:', error);
    throw error;
  }
}

/**
 * Toggle iframe display for a node
 * 
 * @param projectId - Project ID
 * @param nodeId - Node ID
 * @param showIframe - Whether to show iframe
 * @param userId - Current user ID
 */
export async function toggleNodeIframe(
  projectId: string,
  nodeId: string,
  showIframe: boolean,
  userId: string
) {
  const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);
  
  try {
    await updateDoc(nodeRef, {
      showIframe,
      'metadata.updatedBy': userId,
      'metadata.lastModified': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling iframe:', error);
    throw error;
  }
}

/**
 * Batch update node positions (for drag events)
 * Uses debouncing to reduce Firestore writes
 */
export async function batchUpdateNodePositions(
  projectId: string,
  changes: Array<{ id: string; position: { x: number; y: number } }>,
  userId: string
) {
  const batch = changes.map(({ id, position }) =>
    updateNodePosition(projectId, id, position, userId)
  );

  try {
    await Promise.all(batch);
  } catch (error) {
    console.error('Error batch updating positions:', error);
    throw error;
  }
}
```

---

## 🎭 Presence Tracking

### Presence Hook

```typescript
// hooks/usePresence.ts

import { useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserPresence } from '@/types/firestore';

/**
 * Track user presence and cursor position
 * Updates Firestore with user activity
 * 
 * @param projectId - Project ID
 * @param user - Current user info
 */
export function usePresence(
  projectId: string,
  user: { id: string; name: string; email: string; photoURL?: string }
) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    if (!projectId || !user) return;

    const presenceRef = doc(db, `projects/${projectId}/presence/${user.id}`);
    
    // Generate random color for user cursor
    const userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    // Set initial presence
    const setPresence = async () => {
      await setDoc(presenceRef, {
        userId: user.id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || null,
        cursor: null,
        color: userColor,
        currentNode: null,
        lastSeen: Timestamp.now(),
        isActive: true,
      });
    };

    setPresence();

    // Update lastSeen every 30 seconds
    const heartbeat = setInterval(async () => {
      await setDoc(
        presenceRef,
        {
          lastSeen: Timestamp.now(),
          isActive: true,
        },
        { merge: true }
      );
    }, 30000);

    // Subscribe to active users (within last 2 minutes)
    const twoMinutesAgo = Timestamp.fromMillis(Date.now() - 120000);
    const presenceQuery = query(
      collection(db, `projects/${projectId}/presence`),
      where('lastSeen', '>', twoMinutesAgo)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const users: UserPresence[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as UserPresence);
      });
      setActiveUsers(users.filter(u => u.userId !== user.id));
    });

    // Cleanup: mark user as inactive
    return () => {
      clearInterval(heartbeat);
      unsubscribe();
      setDoc(
        presenceRef,
        {
          isActive: false,
          lastSeen: Timestamp.now(),
        },
        { merge: true }
      );
    };
  }, [projectId, user]);

  return { activeUsers };
}

/**
 * Update cursor position for presence
 */
export async function updateCursorPosition(
  projectId: string,
  userId: string,
  cursor: { x: number; y: number } | null
) {
  const presenceRef = doc(db, `projects/${projectId}/presence/${userId}`);
  
  await setDoc(
    presenceRef,
    {
      cursor,
      lastSeen: Timestamp.now(),
    },
    { merge: true }
  );
}
```

---

## 🔐 Conflict Resolution Strategy

### Last-Write-Wins with Timestamps

```typescript
/**
 * Conflict Resolution: Last-Write-Wins
 * 
 * Uses Firestore's built-in timestamp ordering
 * Most recent update (by updatedAt) always wins
 * 
 * Process:
 * 1. User makes change (e.g., drag node)
 * 2. Optimistically update local state
 * 3. Write to Firestore with new timestamp
 * 4. Firestore onSnapshot triggers for all users
 * 5. Local state updates from Firestore (may overwrite optimistic update)
 * 
 * Trade-offs:
 * - Simple to implement
 * - May lose some user changes in high-conflict scenarios
 * - Works well for visual/spatial data (positions)
 */
```

### Optimistic Updates

```typescript
// hooks/useOptimisticGraph.ts

import { useCallback } from 'react';
import { Node, NodeChange, applyNodeChanges } from 'reactflow';
import { updateNodePosition } from '@/lib/graph-operations';
import { debounce } from 'lodash';

/**
 * Handle node changes with optimistic updates
 * Local UI updates immediately, Firestore syncs in background
 */
export function useOptimisticNodeUpdate(
  projectId: string,
  userId: string,
  nodes: Node[],
  setNodes: (nodes: Node[]) => void
) {
  // Debounced Firestore update (300ms)
  const debouncedUpdate = useCallback(
    debounce((nodeId: string, position: { x: number; y: number }) => {
      updateNodePosition(projectId, nodeId, position, userId);
    }, 300),
    [projectId, userId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes immediately to local state (optimistic)
      setNodes(applyNodeChanges(changes, nodes));

      // Find position changes and update Firestore (debounced)
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          debouncedUpdate(change.id, change.position);
        }
      });
    },
    [nodes, setNodes, debouncedUpdate]
  );

  return { onNodesChange };
}
```

### Advanced: CRDT Alternative

```typescript
/**
 * Advanced Conflict Resolution: CRDTs
 * 
 * For production apps with heavy collaboration, consider:
 * 
 * Y.js (Yjs) - CRDT library
 * - Automatic conflict resolution
 * - Preserves all user intentions
 * - Offline-first support
 * - Works with Firestore or custom backend
 * 
 * Implementation:
 * 1. Install: npm install yjs y-firestore
 * 2. Wrap React Flow state in Yjs document
 * 3. Sync Yjs updates to Firestore
 * 4. All users see consistent state
 * 
 * Trade-offs:
 * + Better conflict resolution
 * + Supports offline editing
 * - More complex setup
 * - Larger bundle size
 * 
 * Recommended for:
 * - 10+ simultaneous users
 * - Complex editing workflows
 * - Offline support requirements
 */
```

---

## 📝 Example Data

### Example Nodes

```typescript
// Example Firestore nodes
const exampleNodes: FirestoreNode[] = [
  {
    id: 'node-1',
    url: 'https://example.com',
    thumbUrl: 'https://firebasestorage.googleapis.com/.../homepage.png',
    position: { x: 250, y: 50 },
    showIframe: false,
    title: 'Homepage - Example.com',
    description: 'Welcome to our website',
    parentId: null,
    metadata: {
      lastModified: Timestamp.now(),
      status: 'ready',
      screenshotAt: Timestamp.now(),
      updatedBy: 'user-123',
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'node-2',
    url: 'https://example.com/about',
    thumbUrl: 'https://firebasestorage.googleapis.com/.../about.png',
    position: { x: 50, y: 300 },
    showIframe: false,
    title: 'About Us',
    description: 'Learn more about our company',
    parentId: 'node-1',
    metadata: {
      lastModified: Timestamp.now(),
      status: 'ready',
      screenshotAt: Timestamp.now(),
      updatedBy: 'user-123',
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'node-3',
    url: 'https://example.com/contact',
    thumbUrl: null,
    position: { x: 450, y: 300 },
    showIframe: true,
    title: 'Contact',
    description: 'Get in touch with us',
    parentId: 'node-1',
    metadata: {
      lastModified: Timestamp.now(),
      status: 'pending',
      screenshotAt: null,
      updatedBy: 'user-456',
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];
```

### Example Edges

```typescript
// Example Firestore edges
const exampleEdges: FirestoreEdge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    label: 'About',
    type: 'smoothstep',
    animated: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'edge-1-3',
    source: 'node-1',
    target: 'node-3',
    label: 'Contact',
    type: 'smoothstep',
    animated: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];
```

### React Flow Format

```typescript
// Converted to React Flow format
const reactFlowNodes: SitemapNode[] = [
  {
    id: 'node-1',
    type: 'iframeNode',
    position: { x: 250, y: 50 },
    data: {
      url: 'https://example.com',
      thumbUrl: 'https://firebasestorage.googleapis.com/.../homepage.png',
      showIframe: false,
      title: 'Homepage - Example.com',
      description: 'Welcome to our website',
      parentId: null,
      lastUpdatedBy: 'user-123',
    },
    draggable: true,
    selectable: true,
  },
  // ... more nodes
];

const reactFlowEdges: SitemapEdge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
    animated: true,
    label: 'About',
    data: { label: 'About' },
  },
  // ... more edges
];
```

---

## 🚀 Implementation Checklist

### Phase 1: Basic Sync
- [ ] Create Firestore collections
- [ ] Implement type definitions
- [ ] Create converter functions
- [ ] Build useRealtimeGraph hook
- [ ] Test node/edge sync

### Phase 2: Collaboration
- [ ] Add position update function
- [ ] Implement optimistic updates
- [ ] Add debouncing for drag events
- [ ] Test multi-user editing

### Phase 3: Presence
- [ ] Create presence collection
- [ ] Implement usePresence hook
- [ ] Add cursor tracking
- [ ] Display active users

### Phase 4: Advanced
- [ ] Add conflict resolution
- [ ] Implement offline support
- [ ] Consider Y.js for CRDTs
- [ ] Add undo/redo

---

## 🔒 Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projects
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
      
      // Nodes - anyone with project access can edit
      match /nodes/{nodeId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
      
      // Edges - anyone with project access can edit
      match /edges/{edgeId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
      
      // Presence - users can only update their own presence
      match /presence/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          userId == request.auth.uid;
      }
    }
  }
}
```
