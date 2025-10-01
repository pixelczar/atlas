'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { Download, Share2 } from 'lucide-react';
import { AddNodeInput } from '@/components/canvas/AddNodeInput';
import { SitemapBrowser } from '@/components/projects/SitemapBrowser';
import { ProjectSidebar } from '@/components/canvas/ProjectSidebar';
import { Breadcrumb } from '@/components/canvas/Breadcrumb';
import { addNodeToFirestore, calculateNewNodePosition } from '@/lib/node-operations';
import { LayoutType } from '@/lib/layout-algorithms';

// Dynamic import to avoid SSR issues with React Flow
const SiteMapFlow = dynamic(() => import('@/components/flow/SiteMapFlow'), {
  ssr: false,
  loading: () => null, // No loading state here - handled inside SiteMapFlow
});

export default function CanvasPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project') || 'demo-project';
  
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [existingNodes, setExistingNodes] = useState<any[]>([]);
  const [fitViewFunction, setFitViewFunction] = useState<(() => void) | null>(null);
  const [selectedSitemap, setSelectedSitemap] = useState('All Sitemaps');
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('tree');
  const [showBrowser, setShowBrowser] = useState(false);
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);

  const handleAddNode = useCallback(async (url: string) => {
    setIsAddingNode(true);
    try {
      const userId = 'demo-user'; // TODO: Get from auth context
      
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
      <div className="flex items-center justify-between border-b border-[#5B98D6]/20 bg-[#DDEEF9] px-3 py-1.5">
        <div className="flex items-center gap-3">
          {/* Atlas Logo - triggers sidebar */}
          <button
            onClick={() => setShowProjectSidebar(true)}
            className="transition-opacity hover:opacity-70"
          >
            <AtlasLogo size="sm" />
          </button>

          {/* Breadcrumb */}
          <Breadcrumb
            projectId={projectId}
            selectedSitemap={selectedSitemap}
            onSitemapClick={() => setShowBrowser(true)}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Add Node Input */}
          <div className="w-52">
            <AddNodeInput onAddNode={handleAddNode} isLoading={isAddingNode} />
          </div>
          
          <div className="h-4 w-px bg-[#5B98D6]/20" />
          
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-[#4863B0]/30 bg-transparent px-3 text-xs text-[#1a1a1a]/70 hover:bg-[#4863B0]/10 hover:text-[#1a1a1a]"
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-[#4863B0] px-3 text-xs text-white hover:bg-[#5B98D6]"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <SiteMapFlow 
          projectId={projectId}
          selectedSitemap={selectedSitemap}
          selectedLayout={selectedLayout}
          onSelectSitemap={setSelectedSitemap}
          onSelectLayout={setSelectedLayout}
          onBrowseSitemap={() => setShowBrowser(true)}
          onNodesChange={handleNodesChange} 
          onFlowReady={handleFlowReady}
        />
      </div>

      {/* Sitemap Browser Modal */}
      <SitemapBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        projectId={projectId}
      />

      {/* Project Sidebar */}
      <ProjectSidebar
        isOpen={showProjectSidebar}
        onClose={() => setShowProjectSidebar(false)}
        currentProjectId={projectId}
      />
    </div>
  );
}
