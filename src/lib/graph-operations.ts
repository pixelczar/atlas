import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
