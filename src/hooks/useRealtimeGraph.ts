'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  firestoreNodeToReactFlow,
  firestoreEdgeToReactFlow,
} from '@/lib/firestore-sync';
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
    if (!projectId) {
      setIsLoading(false);
      return;
    }

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
            ...doc.data(),
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
            ...doc.data(),
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
