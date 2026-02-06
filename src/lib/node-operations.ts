import { collection, addDoc, Timestamp, writeBatch, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Generate a unique node ID from URL
 */
export function generateNodeId(url: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `node-${timestamp}-${randomStr}`;
}

/**
 * Extract page title from URL (simple fallback)
 */
export function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove trailing slash and get last segment
    const segments = pathname.replace(/\/$/, '').split('/');
    const lastSegment = segments[segments.length - 1];

    if (lastSegment) {
      // Convert kebab-case or snake_case to Title Case
      return lastSegment
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'New Page';
  }
}

/**
 * Calculate position for new node
 * Places nodes in a grid pattern to avoid overlap
 */
export function calculateNewNodePosition(
  existingNodes: Array<{ position: { x: number; y: number } }>,
  viewportCenter?: { x: number; y: number }
): { x: number; y: number } {
  // Default starting position
  const baseX = viewportCenter?.x ?? 400;
  const baseY = viewportCenter?.y ?? 100;

  if (existingNodes.length === 0) {
    return { x: baseX, y: baseY };
  }

  // Grid layout parameters
  const nodeWidth = 288; // Width of each node (matches the CSS - w-72 = 288px)
  const nodeHeight = 144; // Approximate height of each node (h-36 = 144px)
  const spacing = 60; // Space between nodes (increased to prevent collisions)
  const nodesPerRow = 3; // Number of nodes per row (reduced for better spacing)

  // Calculate grid position
  const nodeIndex = existingNodes.length;
  const row = Math.floor(nodeIndex / nodesPerRow);
  const col = nodeIndex % nodesPerRow;

  // Calculate position with proper spacing
  const x = baseX + (col * (nodeWidth + spacing));
  const y = baseY + (row * (nodeHeight + spacing));

  return { x, y };
}

/**
 * Re-grid all nodes in a project to proper grid positions
 * Calculates optimal columns based on viewport width
 */
export async function regridAllNodes(
  projectId: string,
  nodes: Array<{ id: string; position: { x: number; y: number } }>,
  viewportWidth?: number
): Promise<void> {
  if (nodes.length === 0) {
    return;
  }

  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Grid parameters
    const nodeWidth = 288; // Fixed card width
    const nodeHeight = 180; // Approximate height with spacing
    const spacing = 40; // Space between nodes
    const padding = 100; // Padding from viewport edges

    // Calculate columns based on viewport width
    const availableWidth = (viewportWidth || 1400) - (padding * 2);
    const columnsPerRow = Math.max(1, Math.floor(availableWidth / (nodeWidth + spacing)));

    const batch = writeBatch(db);

    // Calculate new grid positions for all nodes
    nodes.forEach((node, index) => {
      const row = Math.floor(index / columnsPerRow);
      const col = index % columnsPerRow;

      const x = padding + (col * (nodeWidth + spacing));
      const y = padding + (row * (nodeHeight + spacing));

      const nodeRef = doc(db, `projects/${projectId}/nodes`, node.id);
      batch.update(nodeRef, {
        position: { x, y },
        updatedAt: Timestamp.now()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error during re-gridding:', error);
    throw error;
  }
}

/**
 * Add a new node to Firestore
 */
export async function addNodeToFirestore(
  projectId: string,
  url: string,
  position: { x: number; y: number },
  userId: string
) {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const nodeId = generateNodeId(url);
  const title = extractTitleFromUrl(url);

  const nodeData = {
    id: nodeId,
    url,
    thumbUrl: null,
    position,
    showIframe: false,
    title,
    description: null,
    parentId: null,
    metadata: {
      lastModified: Timestamp.now(),
      status: 'pending' as const,
      screenshotAt: null,
      updatedBy: userId,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const nodesRef = collection(db, `projects/${projectId}/nodes`);
  const docRef = await addDoc(nodesRef, nodeData);

  // Trigger screenshot generation using the actual Firestore document ID
  try {
    const response = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, nodeId: docRef.id, projectId }),
    });

    if (!response.ok) {
      console.error('Screenshot API failed:', response.status);
    }
  } catch (error) {
    console.error('Failed to trigger screenshot:', error);
  }

  return docRef.id;
}
