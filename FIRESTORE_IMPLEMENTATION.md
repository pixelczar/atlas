# Atlas - Firestore Implementation Guide

## 🚀 Quick Start

### 1. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init firestore
firebase init storage

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 2. Create Initial Collections

The collections will be auto-created when you add the first document. You can also create them manually in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database
4. Click "Start collection"
5. Create: `projects`, then add subcollections when needed

### 3. Use in Your App

```typescript
import { useRealtimeGraph } from '@/hooks/useRealtimeGraph';
import { usePresence } from '@/hooks/usePresence';

function MyComponent() {
  const projectId = 'project-123';
  const user = { id: 'user-1', name: 'John', email: 'john@example.com' };
  
  // Realtime graph sync
  const { nodes, edges, isLoading } = useRealtimeGraph(projectId);
  
  // Presence tracking
  const { activeUsers } = usePresence(projectId, user);
  
  return (
    // Your React Flow component
  );
}
```

---

## 📊 Data Flow

### Graph Synchronization

```
User Action (Drag Node)
    ↓
Optimistic Local Update (Instant UI feedback)
    ↓
Debounced Firestore Write (300ms delay)
    ↓
Firestore onSnapshot Triggers
    ↓
All Connected Clients Update (Realtime)
```

### Conflict Resolution

**Strategy: Last-Write-Wins (Timestamp-based)**

1. User A drags node to position (100, 200) at 10:00:00.500
2. User B drags same node to (150, 250) at 10:00:00.800
3. Both writes go to Firestore
4. Firestore keeps last write (User B's position)
5. onSnapshot triggers for both users
6. Both see position (150, 250)

**Benefits:**
- Simple to implement
- No merge conflicts
- Works well for visual/spatial data

**Trade-offs:**
- May lose some edits in high-conflict scenarios
- Not suitable for text editing (use CRDTs instead)

---

## 🎯 Implementation Examples

### Example 1: Create a New Project

```typescript
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function createProject(userId: string, sitemapUrl: string) {
  const projectRef = await addDoc(collection(db, 'projects'), {
    name: 'My Sitemap Project',
    sitemapUrl: sitemapUrl,
    ownerId: userId,
    settings: {
      autoLayout: false,
      theme: 'dark',
      showMinimap: true,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return projectRef.id;
}
```

### Example 2: Add Nodes from Sitemap

```typescript
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function addNodesFromSitemap(
  projectId: string,
  urls: string[],
  userId: string
) {
  const batch: Promise<void>[] = [];

  urls.forEach((url, index) => {
    const nodeId = `node-${index + 1}`;
    const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);

    batch.push(
      setDoc(nodeRef, {
        id: nodeId,
        url: url,
        thumbUrl: null,
        position: {
          x: 250 + (index % 3) * 400,
          y: 50 + Math.floor(index / 3) * 300,
        },
        showIframe: false,
        title: null,
        description: null,
        parentId: index === 0 ? null : 'node-1',
        metadata: {
          lastModified: Timestamp.now(),
          status: 'pending',
          screenshotAt: null,
          updatedBy: userId,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    );
  });

  await Promise.all(batch);
}
```

### Example 3: Upload Screenshot and Update Node

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';

async function uploadScreenshot(
  projectId: string,
  nodeId: string,
  imageBlob: Blob,
  userId: string
) {
  // Upload to Storage
  const storageRef = ref(
    storage,
    `projects/${projectId}/screenshots/${nodeId}.png`
  );
  await uploadBytes(storageRef, imageBlob);

  // Get download URL
  const thumbUrl = await getDownloadURL(storageRef);

  // Update Firestore node
  const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);
  await updateDoc(nodeRef, {
    thumbUrl: thumbUrl,
    'metadata.status': 'ready',
    'metadata.screenshotAt': Timestamp.now(),
    'metadata.updatedBy': userId,
    updatedAt: Timestamp.now(),
  });

  return thumbUrl;
}
```

### Example 4: React Flow with Realtime Sync

```typescript
'use client';

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useRealtimeGraph } from '@/hooks/useRealtimeGraph';
import { useOptimisticNodeUpdate } from '@/hooks/useOptimisticGraph';
import IframeNode from '@/components/flow/IframeNode';

const nodeTypes = {
  iframeNode: IframeNode,
};

export function CollaborativeCanvas({ projectId, userId }: Props) {
  // Subscribe to realtime updates
  const { nodes, edges, isLoading } = useRealtimeGraph(projectId);

  // Optimistic updates with debounced Firestore sync
  const { onNodesChange } = useOptimisticNodeUpdate(
    projectId,
    userId,
    nodes,
    setNodes
  );

  if (isLoading) return <div>Loading graph...</div>;

  return (
    <div className="h-screen w-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### Example 5: Display Active Users

```typescript
'use client';

import { usePresence } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ActiveUsers({ projectId, user }: Props) {
  const { activeUsers } = usePresence(projectId, user);

  return (
    <div className="fixed right-4 top-4 flex gap-2">
      {activeUsers.map((activeUser) => (
        <div
          key={activeUser.userId}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2"
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: activeUser.color }}
          />
          <Avatar className="h-6 w-6">
            <AvatarImage src={activeUser.photoURL || undefined} />
            <AvatarFallback>{activeUser.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{activeUser.name}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 Advanced Features

### Offline Support

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab');
  } else if (err.code === 'unimplemented') {
    console.log('Browser does not support offline persistence');
  }
});
```

### Batch Operations

```typescript
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function batchDeleteNodes(projectId: string, nodeIds: string[]) {
  const batch = writeBatch(db);

  nodeIds.forEach((nodeId) => {
    const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);
    batch.delete(nodeRef);
  });

  await batch.commit();
}
```

### Composite Indexes

For complex queries, create indexes in Firebase Console or `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "nodes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "metadata.status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Issue: "Missing or insufficient permissions"

**Solution:** Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

### Issue: Nodes not syncing in realtime

**Check:**
1. Firestore rules allow read access
2. `onSnapshot` is not being unsubscribed prematurely
3. Project ID is correct
4. Network connectivity

### Issue: Too many Firestore writes

**Solution:** Increase debounce delay
```typescript
// In useOptimisticGraph.ts
debounce(updateFunction, 500) // Increase from 300ms to 500ms
```

### Issue: Presence not updating

**Check:**
1. Heartbeat interval is running
2. Timestamp queries are correct
3. User is authenticated

---

## 📈 Performance Tips

1. **Debounce drag events** - Reduce Firestore writes (already implemented)
2. **Use composite indexes** - Speed up complex queries
3. **Limit query results** - Use `.limit()` for large datasets
4. **Cache thumbnails** - Use CDN or browser cache
5. **Lazy load nodes** - Only load visible nodes for large graphs

---

## 🔐 Production Checklist

- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Create composite indexes
- [ ] Enable offline persistence
- [ ] Implement error boundaries
- [ ] Add rate limiting for writes
- [ ] Monitor Firestore usage
- [ ] Set up backup strategy
- [ ] Test with multiple users
- [ ] Implement undo/redo

---

## 📚 Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Storage Documentation](https://firebase.google.com/docs/storage)
- [Security Rules Guide](https://firebase.google.com/docs/rules)
- [React Flow Docs](https://reactflow.dev)
- [Y.js for CRDTs](https://docs.yjs.dev/)
