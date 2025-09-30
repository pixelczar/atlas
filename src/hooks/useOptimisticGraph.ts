'use client';

import { useCallback } from 'react';
import { Node, NodeChange, applyNodeChanges } from 'reactflow';
import { updateNodePosition } from '@/lib/graph-operations';

// Simple debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
