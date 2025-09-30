import { Timestamp } from 'firebase/firestore';
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
