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
    // Clean the projectId to remove any whitespace or newline characters
    const cleanProjectId = projectId.trim();
    
    if (!cleanProjectId || cleanProjectId === 'demo-project' || cleanProjectId.length < 3) {
      setLoading(false);
      return;
    }
    
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const nodesRef = collection(db, `projects/${cleanProjectId}/nodes`);
      const q = query(nodesRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const now = Date.now();
          
          // Only update if enough time has passed since last update (100ms minimum)
          if (now - lastUpdateRef.current < 100) {
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

          // PERFORMANCE: Only update if nodes actually changed to prevent unnecessary re-renders
          // Use a more efficient comparison for large datasets
          const nodesChanged = firestoreNodes.length !== lastNodesRef.current.length || 
            firestoreNodes.some((node, index) => {
              const lastNode = lastNodesRef.current[index];
              return !lastNode || 
                node.id !== lastNode.id || 
                node.position.x !== lastNode.position.x || 
                node.position.y !== lastNode.position.y ||
                node.data?.isHidden !== lastNode.data?.isHidden;
            });
            
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
          console.error('❌ Firestore listener error:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            projectId: cleanProjectId
          });
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
