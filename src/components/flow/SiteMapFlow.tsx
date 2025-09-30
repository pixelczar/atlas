'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
} from 'reactflow';
import { AnimatePresence } from 'framer-motion';
import { doc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';

import IframeNode from './IframeNode';
import { FloatingControls } from '@/components/canvas/FloatingControls';
import { useRealtimeNodes } from '@/hooks/useRealtimeNodes';
import { regridAllNodes } from '@/lib/node-operations';
import { db } from '@/lib/firebase';

const initialEdges: Edge[] = [];

// Component that handles fitView functionality inside ReactFlow
function FlowControls({ 
  onFlowReady, 
  nodes, 
  projectId,
  setFitViewFunction,
  setRegridFunction,
  setZoomInFunction,
  setZoomOutFunction
}: { 
  onFlowReady?: (fitView: () => void, regrid: () => void) => void;
  nodes: any[];
  projectId: string;
  setFitViewFunction: (fn: () => void) => void;
  setRegridFunction: (fn: () => void) => void;
  setZoomInFunction: (fn: () => void) => void;
  setZoomOutFunction: (fn: () => void) => void;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const smoothFitView = useCallback(() => {
    fitView({
      duration: 800,
      padding: 0.2,
    });
  }, [fitView]);

  const handleRegrid = useCallback(async () => {
    try {
      console.log('🎯 Manual re-grid requested for', nodes.length, 'nodes');
      await regridAllNodes(projectId, nodes);
      // Simple fit view after re-gridding
      setTimeout(() => {
        smoothFitView();
      }, 500);
    } catch (error) {
      console.error('❌ Error re-gridding nodes:', error);
      alert(`Failed to re-grid nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [projectId, nodes, smoothFitView]);

  useEffect(() => {
    setFitViewFunction(smoothFitView);
    setRegridFunction(handleRegrid);
    setZoomInFunction(() => zoomIn);
    setZoomOutFunction(() => zoomOut);
    
    if (onFlowReady) {
      onFlowReady(smoothFitView, handleRegrid);
    }
  }, [onFlowReady, smoothFitView, handleRegrid, setFitViewFunction, setRegridFunction, setZoomInFunction, setZoomOutFunction, zoomIn, zoomOut]);

  return null; // This component doesn't render anything
}

interface SiteMapFlowProps {
  projectId?: string;
  onNodesChange?: (nodes: any[]) => void;
  onFlowReady?: (fitView: () => void, regrid: () => void) => void;
}

export default function SiteMapFlow({ projectId = 'demo-project', onNodesChange: onNodesChangeCallback, onFlowReady }: SiteMapFlowProps) {
  const [fitViewFunction, setFitViewFunction] = useState<(() => void) | null>(null);
  const [regridFunction, setRegridFunction] = useState<(() => void) | null>(null);
  const [zoomInFunction, setZoomInFunction] = useState<(() => void) | null>(null);
  const [zoomOutFunction, setZoomOutFunction] = useState<(() => void) | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const [isManuallyMoving, setIsManuallyMoving] = useState(false);
  const nodeTypes = useMemo(() => ({
    iframeNode: IframeNode,
  }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  
  // Custom nodes change handler that respects manual movement
  const handleNodesChange = useCallback((changes: any[]) => {
    // Always apply changes to React Flow
    onNodesChange(changes);
    
    // If manually moving, sync to Firestore but don't trigger re-gridding
    if (isManuallyMoving) {
      console.log('🎯 Syncing manual position changes to Firestore');
      // TODO: Add Firestore sync for manual position changes
      return;
    }
    
    // Normal behavior when not manually moving
    console.log('🎯 Normal node changes - may trigger re-gridding');
  }, [onNodesChange, isManuallyMoving]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    if (!db) {
      console.error('Firestore not initialized');
      return;
    }

    try {
      console.log('🗑️ Attempting to delete node:', nodeId);
      
      // Optimistically remove from React Flow immediately
      setNodes(prevNodes => {
        const filtered = prevNodes.filter(node => node.id !== nodeId);
        console.log('🎯 Optimistically removed node, remaining:', filtered.length);
        return filtered;
      });
      
      // Then delete from Firestore
      const nodeRef = doc(db, `projects/${projectId}/nodes/${nodeId}`);
      console.log('🗑️ Deleting from path:', `projects/${projectId}/nodes/${nodeId}`);
      
      // Add a try-catch specifically for the deleteDoc operation
      try {
        await deleteDoc(nodeRef);
        console.log('✅ Node deleted successfully from Firestore:', nodeId);
      } catch (deleteError) {
        console.error('❌ Firestore delete failed:', deleteError);
        console.error('❌ Delete error details:', {
          code: (deleteError as any).code,
          message: (deleteError as any).message,
          path: `projects/${projectId}/nodes/${nodeId}`
        });
        throw deleteError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('❌ Error deleting node:', error);
      console.error('❌ Full error object:', error);
      // If deletion failed, we should restore the node
      // For now, just log the error
    }
  }, [projectId, setNodes]);

  const { nodes: firestoreNodes, loading } = useRealtimeNodes(projectId, handleDeleteNode);

  // Update nodes when Firestore data changes (simplified)
  useEffect(() => {
    // Skip updates if manually moving nodes
    if (isManuallyMoving) {
      console.log('⏸️ SiteMapFlow: skipping update - manually moving nodes');
      return;
    }

    console.log('🔄 SiteMapFlow: updating nodes:', firestoreNodes.length, 'nodes');
    setNodes(firestoreNodes);
    
    // Notify parent component of current nodes
    if (onNodesChangeCallback) {
      onNodesChangeCallback(firestoreNodes);
    }
  }, [firestoreNodes, setNodes, onNodesChangeCallback, isManuallyMoving]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, style: { stroke: '#5B98D6' } }, eds)),
    [setEdges]
  );

  // Handle node selection changes
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: any[] }) => {
    setSelectedNodes(selectedNodes);
  }, []);

  // Handle node drag start
  const onNodeDragStart = useCallback((event: any, node: any) => {
    setIsManuallyMoving(true);
    console.log('🎯 Manual node movement started for node:', node.id, '- disabling auto re-gridding');
  }, []);

  // Handle node drag stop
  const onNodeDragStop = useCallback((event: any, node: any) => {
    // Keep isManuallyMoving true for longer to prevent auto re-gridding
    setTimeout(() => {
      setIsManuallyMoving(false);
      console.log('🎯 Manual node movement stopped for node:', node.id, '- re-enabling auto re-gridding');
    }, 2000); // Increased delay to 2 seconds
  }, []);

  // Toggle hide state for selected nodes
  const handleToggleHide = useCallback(async () => {
    if (selectedNodes.length === 0) return;

    const hasHiddenNodes = selectedNodes.some(node => node.data?.isHidden);
    const newHiddenState = !hasHiddenNodes;

    // Update nodes with new hidden state
    const updatedNodes = nodes.map(node => {
      if (selectedNodes.some(selected => selected.id === node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            isHidden: newHiddenState
          }
        };
      }
      return node;
    });

    setNodes(updatedNodes);

    // Update in Firestore
    try {
      const batch = writeBatch(db);
      selectedNodes.forEach(node => {
        const nodeRef = doc(db, `projects/${projectId}/nodes`, node.id);
        batch.update(nodeRef, {
          isHidden: newHiddenState,
          updatedAt: Timestamp.now()
        });
      });
      await batch.commit();
      console.log(`✅ ${newHiddenState ? 'Hidden' : 'Shown'} ${selectedNodes.length} nodes`);
    } catch (error) {
      console.error('Error updating node visibility:', error);
    }
  }, [selectedNodes, nodes, setNodes, projectId]);

  // Prevent automatic viewport changes that might cause drifting
  useEffect(() => {
    const handleViewportChange = (event: any) => {
      // Prevent any automatic viewport changes
      if (event.detail && event.detail.source === 'programmatic') {
        return;
      }
    };

    // Add event listener to prevent unwanted viewport changes
    window.addEventListener('resize', handleViewportChange);
    
    return () => {
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#DDEEF9]">
        <p className="text-[#1a1a1a]/60">Loading canvas...</p>
      </div>
    );
  }


  return (
    <div className="h-full w-full">
      <AnimatePresence>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          className="bg-[#DDEEF9]"
          panOnDrag={true}
          panOnScroll={false}
          zoomOnScroll={true}
          zoomOnPinch={true}
          preventScrolling={false}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          snapToGrid={false}
          snapGrid={[1, 1]}
          nodeDragThreshold={1}
        >
          <FlowControls 
            onFlowReady={onFlowReady} 
            nodes={nodes} 
            projectId={projectId}
            setFitViewFunction={setFitViewFunction}
            setRegridFunction={setRegridFunction}
            setZoomInFunction={setZoomInFunction}
            setZoomOutFunction={setZoomOutFunction}
          />
          <Background gap={16} size={1} className="bg-[#DDEEF9]" color="#5B98D6" />
        </ReactFlow>
      </AnimatePresence>
      
      {/* Floating Controls */}
      <FloatingControls
        onRegrid={() => regridFunction?.()}
        onFitView={() => fitViewFunction?.()}
        onToggleHide={handleToggleHide}
        selectedNodes={selectedNodes}
        onZoomIn={() => zoomInFunction?.()}
        onZoomOut={() => zoomOutFunction?.()}
      />
    </div>
  );
}