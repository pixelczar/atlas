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
import { doc, deleteDoc, writeBatch, Timestamp, updateDoc } from 'firebase/firestore';

import IframeNode from './IframeNode';
import { FloatingControls } from '@/components/canvas/FloatingControls';
import { SelectionToolbar } from '@/components/canvas/SelectionToolbar';
import { CanvasLoader } from '@/components/canvas/CanvasLoader';
import { useRealtimeNodes } from '@/hooks/useRealtimeNodes';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { applyLayout, LayoutType } from '@/lib/layout-algorithms';

// Component that handles viewport helpers inside ReactFlow
function FlowControls({ 
  onFlowReady, 
  nodes, 
  projectId,
  setFitViewFunction,
  setRegridFunction,
  setZoomInFunction,
  setZoomOutFunction,
  setFocusNodeFunction,
  onFocusNode
}: { 
  onFlowReady?: (noopFitView: () => void, regrid: () => void) => void;
  nodes: any[];
  projectId: string;
  setFitViewFunction: (fn: () => void) => void;
  setRegridFunction: (fn: () => void) => void;
  setZoomInFunction: (fn: () => void) => void;
  setZoomOutFunction: (fn: () => void) => void;
  setFocusNodeFunction: (fn: (nodeId: string) => void) => void;
  onFocusNode?: (focusNodeFn: (nodeId: string) => void) => void;
}) {
  const { zoomIn, zoomOut, setCenter, getViewport, setViewport } = useReactFlow();
  const viewportRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  
  // Save viewport every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const vp = getViewport();
      viewportRef.current = vp;
    }, 100);
    return () => clearInterval(interval);
  }, [getViewport]);

  // Removed fitView usage entirely
  const smoothFitView = useCallback(() => {}, []);

  const handleRegrid = useCallback(async () => {
    // DISABLED - Manual regrid only
    // Do nothing
  }, []);

  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Calculate node center point
    const nodeWidth = 288; // Standard node width
    const nodeHeight = 150; // Standard node height
    const x = node.position.x + nodeWidth / 2;
    const y = node.position.y + nodeHeight / 2;

    // Center on the node with a more comfortable zoom level
    setCenter(x, y, { zoom: 0.8, duration: 800 });
  }, [nodes, setCenter]);

  useEffect(() => {
    setFitViewFunction(() => {});
    setRegridFunction(handleRegrid);
    setZoomInFunction(() => zoomIn);
    setZoomOutFunction(() => zoomOut);
    setFocusNodeFunction(() => focusNode);
    
    if (onFocusNode) {
      onFocusNode(focusNode);
    }
  }, [onFocusNode, handleRegrid, setFitViewFunction, setRegridFunction, setZoomInFunction, setZoomOutFunction, setFocusNodeFunction, zoomIn, zoomOut, focusNode]);

  return null; // This component doesn't render anything
}

interface SiteMapFlowProps {
  projectId?: string;
  selectedSitemap?: string;
  selectedLayout?: LayoutType;
  searchTerm?: string;
  onSelectSitemap?: (sitemap: string) => void;
  onSelectLayout?: (layout: LayoutType) => void;
  onBrowseSitemap?: () => void;
  onFlowReady?: (fitView: () => void, regrid: () => void) => void;
  onPreviewOpen?: (url: string) => void;
  onFocusNode?: (focusNodeFn: (nodeId: string) => void) => void;
  onNodeSelection?: (node: { id: string; url: string; title: string } | null) => void;
}

export default function SiteMapFlow({
  projectId = 'demo-project',
  selectedSitemap = 'All Sitemaps',
  selectedLayout = 'elk',
  searchTerm = '',
  onSelectSitemap,
  onSelectLayout,
  onBrowseSitemap,
  onFlowReady,
  onPreviewOpen,
  onFocusNode,
  onNodeSelection
}: SiteMapFlowProps) {
  const [fitViewFunction, setFitViewFunction] = useState<(() => void) | null>(null);
  const [regridFunction, setRegridFunction] = useState<(() => void) | null>(null);
  const [zoomInFunction, setZoomInFunction] = useState<(() => void) | null>(null);
  const [zoomOutFunction, setZoomOutFunction] = useState<(() => void) | null>(null);
  const [focusNodeFunction, setFocusNodeFunction] = useState<((nodeId: string) => void) | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const [isManuallyMoving, setIsManuallyMoving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [needsInitialFitView, setNeedsInitialFitView] = useState(false);
  const [hasAppliedLayout, setHasAppliedLayout] = useState(false);
  const savedViewportRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const reactFlowInstance = useRef<any>(null);
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
          type: data.type || 'default',
          animated: data.animated || false,
          label: data.label || '',
          style: { stroke: '#5B98D6', strokeWidth: 2, opacity: 0.4 },
        };
      });
      
      console.log(`📊 Loaded ${firestoreEdges.length} edges`);
      setEdges(firestoreEdges as Edge[]);
    });

    return () => unsubscribe();
  }, [projectId, setEdges]);
  
  // Custom nodes change handler that respects manual movement
  const handleNodesChange = useCallback((changes: any[]) => {
    // CRITICAL FIX: Filter out mass 'select' changes that cause zoom-out
    // When you click a node, React Flow sends 'select' changes for ALL nodes
    // This causes it to zoom out to fit all nodes
    const filteredChanges = changes.filter(change => {
      // Allow position changes (dragging)
      if (change.type === 'position') return true;
      // Allow dimension changes
      if (change.type === 'dimensions') return true;
      // Allow remove changes
      if (change.type === 'remove') return true;
      // Allow add changes
      if (change.type === 'add') return true;
      // Block mass select changes (more than 10 at once)
      if (change.type === 'select' && changes.length > 10) {
        return false;
      }
      // Allow individual select changes
      if (change.type === 'select') return true;
      // Allow other changes
      return true;
    });
    
    // Only apply if we have filtered changes
    if (filteredChanges.length > 0) {
      onNodesChange(filteredChanges);
    }
    
    // If manually moving, just return - no re-gridding
    if (isManuallyMoving) {
      return;
    }
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

  // PERFORMANCE: Use useMemo for expensive filtering operations
  const filteredNodes = useMemo(() => {
    if (selectedSitemap === 'All Sitemaps') {
      return firestoreNodes;
    }
    
    console.log(`🔍 Filtering nodes for sitemap: ${selectedSitemap}`);
    return firestoreNodes.filter((node: any) => {
      const nodeSitemap = node.data?.sitemapSource;
      return nodeSitemap === selectedSitemap;
    });
  }, [firestoreNodes, selectedSitemap]);

  // PERFORMANCE: Use useMemo for visible nodes filtering
  const visibleNodes = useMemo(() => {
    return filteredNodes.filter((node: any) => !node.data?.isHidden);
  }, [filteredNodes]);

  // PERFORMANCE: Use useMemo for search highlighting
  const highlightedNodes = useMemo(() => {
    if (!searchTerm) {
      return visibleNodes;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return visibleNodes.map((node: any) => {
      const isHighlighted = (
        node.data?.url?.toLowerCase().includes(searchLower) ||
        node.data?.label?.toLowerCase().includes(searchLower)
      );
      
      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: !!isHighlighted,
          searchTerm: searchTerm
        }
      };
    });
  }, [visibleNodes, searchTerm]);

  // PERFORMANCE OPTIMIZED: Apply layout when nodes change or layout type changes
  useEffect(() => {
    console.log(`🎯 Layout effect triggered: ${firestoreNodes.length} nodes, layout: ${selectedLayout}, sitemap: ${selectedSitemap}`);
    
    // Skip if manually moving nodes
    if (isManuallyMoving) {
      console.log('⏸️ Skipping layout - manually moving nodes');
      return;
    }
    
    // Skip if no nodes
    if (firestoreNodes.length === 0) {
      console.log('⏸️ Skipping layout - no nodes');
      return;
    }
    
    const currentHiddenCount = filteredNodes.length - visibleNodes.length;
    
    // Update counts
    setVisibleCount(visibleNodes.length);
    setHiddenCount(currentHiddenCount);
    
    // PERFORMANCE: Only apply layout if we have nodes and it's not the same as current
    if (highlightedNodes.length > 0) {
      const layoutOptions = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      console.log(`🎯 Applying ${selectedLayout} layout to ${highlightedNodes.length} nodes`);
      
      // PERFORMANCE: Debounce layout application for large datasets
      const layoutTimeout = setTimeout(() => {
        try {
          const layoutedNodes = applyLayout(highlightedNodes, selectedLayout, layoutOptions);
          setNodes(layoutedNodes);
          setNeedsInitialFitView(true);
        } catch (error) {
          console.error('❌ Layout failed:', error);
          // Fallback to grid layout
          const fallbackNodes = applyLayout(highlightedNodes, 'grid', layoutOptions);
          setNodes(fallbackNodes);
          setNeedsInitialFitView(true);
        }
      }, highlightedNodes.length > 100 ? 100 : 0); // Debounce for large datasets
      
      return () => clearTimeout(layoutTimeout);
    }
  }, [firestoreNodes, selectedSitemap, selectedLayout, searchTerm, isManuallyMoving, filteredNodes, visibleNodes, highlightedNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      style: { 
        stroke: '#5B98D6',
        strokeWidth: 2,
        opacity: 0.4,
      },
      type: 'default',
      animated: false,
    }, eds)),
    [setEdges]
  );

  // Track if user is dragging to prevent auto-preview
  const [hasMoved, setHasMoved] = useState(false);

  // Handle node selection changes - lightweight, no Firebase sync
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: any[] }) => {
    // Only update if selection actually changed to prevent unnecessary re-renders
    setSelectedNodes(prev => {
      if (prev.length !== selectedNodes.length || 
          !prev.every((node, i) => node.id === selectedNodes[i]?.id)) {
        return selectedNodes;
      }
      return prev; // No change, return same reference
    });
  }, []);

  // Auto-open preview when single node is selected (but not if it was a drag)
  useEffect(() => {
    if (selectedNodes.length === 1 && onPreviewOpen && !hasMoved) {
      const selectedNode = selectedNodes[0];
      if (selectedNode?.data?.url) {
        console.log('🎯 Auto-opening preview for selected node:', selectedNode.data.url);
        onPreviewOpen(selectedNode.data.url);
        
        // Also focus the node
        if (focusNodeFunction) {
          setTimeout(() => {
            focusNodeFunction(selectedNode.id);
          }, 100);
        }
      }
    }
    
    // Update breadcrumb with selected node
    if (onNodeSelection) {
      if (selectedNodes.length === 1) {
        const selectedNode = selectedNodes[0];
        onNodeSelection({
          id: selectedNode.id,
          url: selectedNode.data?.url || '',
          title: selectedNode.data?.label || selectedNode.data?.title || 'Untitled'
        });
      } else {
        onNodeSelection(null);
      }
    }
  }, [selectedNodes, onPreviewOpen, focusNodeFunction, onNodeSelection, hasMoved]);

  // Handle node drag start
  const onNodeDragStart = useCallback((event: any, node: any) => {
    setIsManuallyMoving(true);
    setHasMoved(true); // Assume any drag start means user is dragging
  }, []);

  // PERFORMANCE: Debounced position saving to prevent excessive Firestore writes
  const savePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPositionsRef = useRef<Map<string, any>>(new Map());

  // Handle node drag stop - save position to Firestore with debouncing
  const onNodeDragStop = useCallback(async (event: any, node: any) => {
    // Store the position for debounced saving
    pendingPositionsRef.current.set(node.id, node.position);
    
    // Clear existing timeout
    if (savePositionTimeoutRef.current) {
      clearTimeout(savePositionTimeoutRef.current);
    }
    
    // Set new timeout for batch saving
    savePositionTimeoutRef.current = setTimeout(async () => {
      if (pendingPositionsRef.current.size === 0) return;
      
      try {
        // Batch update all pending positions
        const batch = writeBatch(db);
        const positions = Array.from(pendingPositionsRef.current.entries());
        
        for (const [nodeId, position] of positions) {
          const nodeRef = doc(db, `projects/${projectId}/nodes`, nodeId);
          batch.update(nodeRef, {
            position: position,
            updatedAt: Timestamp.now()
          });
        }
        
        await batch.commit();
        console.log(`✅ Batch saved ${positions.length} node positions`);
        pendingPositionsRef.current.clear();
      } catch (error) {
        console.error('Error batch saving node positions:', error);
      }
    }, 500); // 500ms debounce
    
    // Reset drag tracking
    setHasMoved(false);
    
    // Keep isManuallyMoving true to prevent layout re-application
    // This allows manual positioning to persist
  }, [projectId]);

  // Reset manual positioning to allow layout re-application
  const resetManualPositioning = useCallback(() => {
    setIsManuallyMoving(false);
    console.log('🔄 Reset manual positioning - layout will be re-applied');
  }, []);


  // Toggle hide state for selected nodes
  const handleToggleHide = useCallback(async (nodeId?: string) => {
    const targetNodes = nodeId ? [nodes.find(n => n.id === nodeId)].filter(Boolean) : selectedNodes;
    if (targetNodes.length === 0) return;

    const hasHiddenNodes = targetNodes.some(node => node.data?.isHidden);
    const newHiddenState = !hasHiddenNodes;

    // Update nodes with new hidden state
    const updatedNodes = nodes.map(node => {
      if (targetNodes.some(selected => selected.id === node.id)) {
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
      targetNodes.forEach(node => {
        const nodeRef = doc(db, `projects/${projectId}/nodes`, node.id);
        batch.update(nodeRef, {
          isHidden: newHiddenState,
          updatedAt: Timestamp.now()
        });
      });
      await batch.commit();
      console.log(`✅ ${newHiddenState ? 'Hidden' : 'Shown'} ${targetNodes.length} nodes`);
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
  const handleOpenExternal = useCallback((nodeId?: string) => {
    const targetNode = nodeId ? nodes.find(n => n.id === nodeId) : (selectedNodes.length === 1 ? selectedNodes[0] : null);
    if (targetNode?.data?.url) {
      window.open(targetNode.data.url, '_blank');
    }
  }, [selectedNodes, nodes]);

  // Toggle iframe for selected node (single selection only)
  const handleToggleIframe = useCallback((nodeId?: string) => {
    const targetNode = nodeId ? nodes.find(n => n.id === nodeId) : (selectedNodes.length === 1 ? selectedNodes[0] : null);
    if (targetNode?.data?.url && onPreviewOpen) {
      onPreviewOpen(targetNode.data.url);
      
      // Focus and zoom to the selected node
      if (focusNodeFunction) {
        setTimeout(() => {
          focusNodeFunction(targetNode.id);
        }, 100); // Small delay to ensure preview panel animation starts
      }
    }
  }, [selectedNodes, nodes, onPreviewOpen, focusNodeFunction]);

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

  // Add toolbar functions to nodes
  const nodesWithToolbar = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onToggleIframe: () => handleToggleIframe(node.id),
        onOpenExternal: () => handleOpenExternal(node.id),
        onToggleVisibility: () => handleToggleHide(node.id),
        // Delete button removed - doesn't make sense in this context
      }
    }));
  }, [nodes, handleToggleIframe, handleOpenExternal, handleToggleHide]);

  if (loading) {
    return (
      <div className="relative h-full w-full">
        <CanvasLoader />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
          <ReactFlow
            nodes={nodesWithToolbar}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onInit={(instance) => { 
              reactFlowInstance.current = instance;
              // Removed automatic fitView to prevent zoom reset
              setNeedsInitialFitView(false);
            }}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: 'default' }}
            className="bg-[#F8FAFC]"
            panOnDrag={true}
            panOnScroll={false}
            zoomOnScroll={true}
            zoomOnPinch={true}
            preventScrolling={true}
            zoomOnDoubleClick={false}
            nodesDraggable={nodes.length < 200} // Disable dragging for very large datasets
            nodesConnectable={false}
            elementsSelectable={true}
            selectNodesOnDrag={false}
            minZoom={0.1}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
            nodesFocusable={false}
            edgesFocusable={false}
            autoPanOnNodeDrag={false}
            autoPanOnConnect={false}
            elevateNodesOnSelect={false}
            zoomActivationKeyCode={null}
            nodeOrigin={[0, 0]}
            translateExtent={[[-Infinity, -Infinity], [Infinity, Infinity]]}
            deleteKeyCode={null}
            multiSelectionKeyCode={null}
            // PERFORMANCE: React Flow optimizations for large datasets
            onlyRenderVisibleElements={true}
            style={{
              imageRendering: 'crisp-edges',
              backfaceVisibility: 'hidden',
            }} 
          >
          <FlowControls 
            onFlowReady={onFlowReady} 
            nodes={nodes} 
            projectId={projectId}
            setFitViewFunction={setFitViewFunction}
            setRegridFunction={setRegridFunction}
            setZoomInFunction={setZoomInFunction}
            setZoomOutFunction={setZoomOutFunction}
            setFocusNodeFunction={setFocusNodeFunction}
            onFocusNode={onFocusNode}
          />
          <Background gap={16} size={1} className="bg-[#F8FAFC]" color="#5B98D6" />
          
          {/* Minimap */}
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.isHidden) return '#e5e7eb';
              if (node.data?.isHighlighted) return '#fbbf24';
              return '#5B98D6';
            }}
            nodeStrokeWidth={2}
            nodeStrokeColor="#ffffff"
            nodeBorderRadius={8}
            maskColor="rgba(0, 0, 0, 0.1)"
            position="bottom-right"
            style={{
              backgroundColor: 'rgba(248, 250, 252, 0.95)',
              border: '1px solid rgba(91, 152, 214, 0.2)',
              borderRadius: '8px',
            }}
            pannable={false}
            zoomable={false}
            className="minimap-custom"
          />
          
          {/* Selection Toolbar removed - now handled inside each node */}
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
        onResetLayout={resetManualPositioning}
      />

      {/* Node Stats Indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="pointer-events-none fixed right-8 top-20 z-30"
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