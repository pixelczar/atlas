import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Node } from 'reactflow';

export function useRealtimeNodes(projectId: string, onDeleteNode?: (nodeId: string) => void) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    
    if (!db) {
      console.warn('Firestore not initialized - running in demo mode');
      setLoading(false);
      return;
    }

    try {
      const nodesRef = collection(db, `projects/${projectId}/nodes`);
      const q = query(nodesRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const now = Date.now();
          
          // Only update if enough time has passed since last update (500ms minimum)
          if (now - lastUpdateRef.current < 500) {
            console.log('⏸️ Skipping update - too soon since last update');
            return;
          }
          
          console.log('📊 Firestore snapshot received:', snapshot.docs.length, 'documents');
          const firestoreNodes = snapshot.docs.map((doc) => {
            const data = doc.data();
            
            // Ensure position is properly formatted
            let position = { x: 0, y: 0 };
            if (data.position) {
              position = {
                x: typeof data.position.x === 'number' ? data.position.x : 0,
                y: typeof data.position.y === 'number' ? data.position.y : 0,
              };
            }
            
            return {
              id: doc.id, // Use the actual Firestore document ID
              type: 'iframeNode',
              position,
              data: {
                label: data.title || 'Untitled',
                url: data.url,
                thumbnailUrl: data.thumbUrl,
                status: data.metadata?.status || 'pending',
                isHidden: data.isHidden || false,
                onDelete: onDeleteNode,
              },
            };
          });

          console.log('🎯 Setting nodes:', firestoreNodes.length, 'nodes');
          setNodes(firestoreNodes as Node[]);
          lastUpdateRef.current = now;
          setLoading(false);
        },
        (error) => {
          console.error('Firestore listener error:', error);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Firestore listener:', error);
      setLoading(false);
    }
  }, [projectId]);

  return { nodes, loading };
}
