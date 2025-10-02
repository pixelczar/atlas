import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Node } from 'reactflow';

export function useRealtimeNodes(projectId: string, onDeleteNode?: (nodeId: string) => void) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const lastUpdateRef = useRef<number>(0);
  const lastNodesRef = useRef<Node[]>([]);

  useEffect(() => {
    if (!projectId || projectId === 'demo-project') {
      console.log('🚫 Skipping Firestore listener - no valid project ID');
      setLoading(false);
      return;
    }
    
    if (!db) {
      console.warn('Firestore not initialized - running in demo mode');
      setLoading(false);
      return;
    }

    console.log('🔥 Setting up Firestore listener for project:', projectId);
    try {
      const nodesRef = collection(db, `projects/${projectId}/nodes`);
      const q = query(nodesRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const now = Date.now();
          
          // Only update if enough time has passed since last update (1000ms minimum)
          if (now - lastUpdateRef.current < 1000) {
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
                sitemapSource: data.sitemapSource || 'sitemap.xml',
                onDelete: onDeleteNode,
              },
            };
          });

          // Only update if nodes actually changed to prevent unnecessary re-renders
          const nodesChanged = JSON.stringify(firestoreNodes) !== JSON.stringify(lastNodesRef.current);
          if (nodesChanged) {
            console.log('🎯 Setting nodes:', firestoreNodes.length, 'nodes');
            setNodes(firestoreNodes as Node[]);
            lastNodesRef.current = firestoreNodes as Node[];
          } else {
            console.log('⏸️ Skipping update - nodes unchanged');
          }
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
