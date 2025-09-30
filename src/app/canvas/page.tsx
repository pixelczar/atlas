'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { AddNodeInput } from '@/components/canvas/AddNodeInput';
import { addNodeToFirestore, calculateNewNodePosition } from '@/lib/node-operations';

// Dynamic import to avoid SSR issues with React Flow
const SiteMapFlow = dynamic(() => import('@/components/flow/SiteMapFlow'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#DDEEF9]">
      <p className="text-[#1a1a1a]/60">Loading canvas...</p>
    </div>
  ),
});

export default function CanvasPage() {
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [existingNodes, setExistingNodes] = useState<any[]>([]);
  const [fitViewFunction, setFitViewFunction] = useState<(() => void) | null>(null);

  const handleAddNode = useCallback(async (url: string) => {
    setIsAddingNode(true);
    try {
      // For demo, use a mock project ID and user ID
      // In production, get these from auth context and route params
      const projectId = 'demo-project';
      const userId = 'demo-user';
      
      // Calculate position for new node using existing nodes
      const position = calculateNewNodePosition(existingNodes, { x: 400, y: 200 });
      
      // Add node to Firestore (triggers screenshot generation)
      await addNodeToFirestore(projectId, url, position, userId);
      
      console.log('✅ Node added:', { url, position });
      
      // Don't auto-fit view - let user control the viewport
    } catch (error) {
      console.error('Error adding node:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to add node'}\n\nFirebase might not be fully configured.`);
    } finally {
      setIsAddingNode(false);
    }
  }, [existingNodes, fitViewFunction]);

  const handleNodesChange = useCallback((nodes: any[]) => {
    setExistingNodes(nodes);
  }, []);

  const handleFlowReady = useCallback((fitView: () => void, regrid: () => void) => {
    setFitViewFunction(() => fitView);
    
    // Don't auto-fit view on load - let user control the viewport
    console.log('🎯 Flow ready, fitView function set');
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#DDEEF9]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#5B98D6]/20 bg-[#DDEEF9] px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-[#1a1a1a]/60 hover:bg-[#5B98D6]/10 hover:text-[#1a1a1a]"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </Button>
          </Link>
          <AtlasLogo size="md"  />
        </div>
        <div className="flex items-center gap-3">
          {/* Add Node Input */}
          <div className="w-64">
            <AddNodeInput onAddNode={handleAddNode} isLoading={isAddingNode} />
          </div>
          
          <div className="h-4 w-px bg-gray-800" />
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#4863B0]/30 bg-transparent text-[#1a1a1a]/70 hover:bg-[#4863B0]/10 hover:text-[#1a1a1a]"
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-[#4863B0] text-white hover:bg-[#5B98D6]"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <SiteMapFlow 
          onNodesChange={handleNodesChange} 
          onFlowReady={handleFlowReady}
        />
      </div>
    </div>
  );
}
