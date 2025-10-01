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
import { AnimatePresence, motion } from 'framer-motion';
import { doc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';

import IframeNode from './IframeNode';
import { FloatingControls } from '@/components/canvas/FloatingControls';
import { SelectionToolbar } from '@/components/canvas/SelectionToolbar';
import { CanvasLoader } from '@/components/canvas/CanvasLoader';
import { useRealtimeNodes } from '@/hooks/useRealtimeNodes';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { applyLayout, LayoutType } from '@/lib/layout-algorithms';

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
    // TODO: Re-apply hierarchical layout
    // For now, just fit view to show all nodes
    console.log('🎯 Fit view requested');
    smoothFitView();
  }, [smoothFitView]);

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
  selectedSitemap?: string;
  selectedLayout?: LayoutType;
  onSelectSitemap?: (sitemap: string) => void;
  onSelectLayout?: (layout: LayoutType) => void;
  onBrowseSitemap?: () => void;
  onNodesChange?: (nodes: any[]) => void;
  onFlowReady?: (fitView: () => void, regrid: () => void) => void;
}

export default function SiteMapFlow({
  projectId = 'demo-project',
  selectedSitemap = 'All Sitemaps',
  selectedLayout = 'tree',
  onSelectSitemap,
  onSelectLayout,
  onBrowseSitemap,
  onNodesChange: onNodesChangeCallback, 
  onFlowReady 
}: SiteMapFlowProps) {
  const [fitViewFunction, setFitViewFunction] = useState<(() => void) | null>(null);
  const [regridFunction, setRegridFunction] = useState<(() => void) | null>(null);
  const [zoomInFunction, setZoomInFunction] = useState<(() => void) | null>(null);
  const [zoomOutFunction, setZoomOutFunction] = useState<(() => void) | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const [isManuallyMoving, setIsManuallyMoving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const nodeTypes = useMemo(() => ({
    iframeNode: IframeNode,
  }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Load edges from Firestore
  useEffect(() => {
    if (!projectId || !db) return;

    const edgesRef = collection(db, `projects/${projectId}/edges`);
    const q = query(edgesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreEdges = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          source: data.source,
          target: data.target,
          type: data.type || 'smoothstep',
          animated: data.animated || false,
          label: data.label || '',
          style: { stroke: '#4863B0', strokeWidth: 2 },
        };
      });
      
      console.log(`📊 Loaded ${firestoreEdges.length} edges`);
      setEdges(firestoreEdges as Edge[]);
    });

    return () => unsubscribe();
  }, [projectId, setEdges]);
  
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

    // Filter nodes based on selected sitemap
    let filteredNodes = firestoreNodes;
    if (selectedSitemap !== 'All Sitemaps') {
      filteredNodes = firestoreNodes.filter((node: any) => {
        const nodeSitemap = node.data?.sitemapSource || node.sitemapSource;
        return nodeSitemap === selectedSitemap;
      });
      console.log(`🔍 Filtered to ${filteredNodes.length} nodes from ${selectedSitemap}`);
    }

    // Filter out hidden nodes
    const visibleNodes = filteredNodes.filter((node: any) => {
      return !node.data?.isHidden;
    });
    
    const currentHiddenCount = filteredNodes.length - visibleNodes.length;
    
    // Update counts
    setVisibleCount(visibleNodes.length);
    setHiddenCount(currentHiddenCount);
    
    if (currentHiddenCount > 0) {
      console.log(`👁️ Hiding ${currentHiddenCount} nodes, showing ${visibleNodes.length}`);
    }

    // Apply selected layout
    const layoutOptions = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const layoutedNodes = applyLayout(visibleNodes, selectedLayout, layoutOptions);

    console.log('🔄 SiteMapFlow: updating nodes with', selectedLayout, 'layout:', layoutedNodes.length, 'nodes');
    setNodes(layoutedNodes);
    
    // Notify parent component of current nodes
    if (onNodesChangeCallback) {
      onNodesChangeCallback(layoutedNodes);
    }
  }, [firestoreNodes, setNodes, onNodesChangeCallback, isManuallyMoving, selectedSitemap, selectedLayout]);

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

  // Delete selected nodes
  const handleDeleteSelected = useCallback(async () => {
    if (selectedNodes.length === 0) return;

    const confirmed = window.confirm(`Delete ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}?`);
    if (!confirmed) return;

    // Delete each selected node
    for (const node of selectedNodes) {
      await handleDeleteNode(node.id);
    }
  }, [selectedNodes, handleDeleteNode]);

  // Open external URL for selected node (single selection only)
  const handleOpenExternal = useCallback(() => {
    if (selectedNodes.length === 1) {
      const url = selectedNodes[0].data?.url;
      if (url) {
        window.open(url, '_blank');
      }
    }
  }, [selectedNodes]);

  // Toggle iframe for selected node (single selection only)
  const handleToggleIframe = useCallback(() => {
    if (selectedNodes.length === 1) {
      // This would need to be implemented in the node data
      console.log('Toggle iframe for node:', selectedNodes[0].id);
      // For now, just open in external tab
      handleOpenExternal();
    }
  }, [selectedNodes, handleOpenExternal]);

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
      <div className="relative h-full w-full">
        <CanvasLoader />
      </div>
    );
  }


  return (
    <div className="relative h-full w-full">
      {/* Loading Animation */}
      <AnimatePresence>
        {(loading || nodes.length === 0) && <CanvasLoader />}
      </AnimatePresence>

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
          minZoom={0.1}
          maxZoom={4}
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
      
      {/* Floating Controls - High z-index to stay on top */}
      <FloatingControls
        projectId={projectId}
        selectedSitemap={selectedSitemap}
        selectedLayout={selectedLayout}
        onSelectSitemap={onSelectSitemap || (() => {})}
        onSelectLayout={onSelectLayout || (() => {})}
        onBrowseSitemap={onBrowseSitemap}
        onFitView={() => fitViewFunction?.()}
        onZoomIn={() => zoomInFunction?.()}
        onZoomOut={() => zoomOutFunction?.()}
      />

      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedNodes={selectedNodes}
        onToggleIframe={handleToggleIframe}
        onOpenExternal={handleOpenExternal}
        onDelete={handleDeleteSelected}
        onToggleVisibility={handleToggleHide}
      />

      {/* Node Stats Indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="pointer-events-none fixed right-8 top-20 z-50"
      >
        <div className="pointer-events-auto rounded-xl border border-[#5B98D6]/20 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4863B0]" />
              <span className="font-medium text-[#1a1a1a]">{visibleCount} shown</span>
            </div>
            {hiddenCount > 0 && (
              <>
                <div className="h-3 w-px bg-[#5B98D6]/20" />
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#1a1a1a]/20" />
                  <span className="text-[#1a1a1a]/40">{hiddenCount} hidden</span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}