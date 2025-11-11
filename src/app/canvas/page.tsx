'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { Download, Share2 } from 'lucide-react';
import { ProjectSidebar } from '@/components/canvas/ProjectSidebar';
import { Breadcrumb } from '@/components/canvas/Breadcrumb';
import { IframePreviewPanel } from '@/components/canvas/IframePreviewPanel';
import { LayoutType } from '@/lib/layout-algorithms';
import { testFirestoreConnection } from '@/lib/firestore-test';

// Dynamic import to avoid SSR issues with React Flow
const SiteMapFlow = dynamic(() => import('@/components/flow/SiteMapFlow'), {
  ssr: false,
  loading: () => null, // No loading state here - handled inside SiteMapFlow
});

function CanvasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawProjectId = searchParams.get('project') || 'demo-project';
  const projectId = rawProjectId.trim();
  
  // Clean projectId (remove any whitespace/newlines)
  
  const [selectedSitemap, setSelectedSitemap] = useState('All Sitemaps');
  
  // Load saved sitemap selection from localStorage
  useEffect(() => {
    const savedSitemap = localStorage.getItem(`atlas-sitemap-${projectId}`);
    if (savedSitemap) {
      setSelectedSitemap(savedSitemap);
      console.log(`🎯 Canvas: Restored sitemap selection: ${savedSitemap}`);
    }
  }, [projectId]);
  
  // Save sitemap selection to localStorage when it changes
  useEffect(() => {
    if (selectedSitemap !== 'All Sitemaps') {
      localStorage.setItem(`atlas-sitemap-${projectId}`, selectedSitemap);
      console.log(`🎯 Canvas: Saved sitemap selection: ${selectedSitemap}`);
    }
  }, [selectedSitemap, projectId]);
  
  // Debug sitemap changes
  useEffect(() => {
    console.log(`🎯 Canvas: selectedSitemap changed to: ${selectedSitemap}`);
  }, [selectedSitemap]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('elk');
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  const openPagesRef = useRef<(() => void) | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [iframePreviewUrl, setIframePreviewUrl] = useState<string | null>(null);
  const [focusNodeFn, setFocusNodeFn] = useState<((nodeId: string) => void) | null>(null);
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    url: string;
    title: string;
  } | null>(null);

  const handleFlowReady = useCallback((_: () => void, __: () => void) => {
    console.log('🎯 Flow ready');
  }, []);

  const handleFocusNode = useCallback((focusNodeFunction: (nodeId: string) => void) => {
    setFocusNodeFn(() => focusNodeFunction);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePreviewOpen = useCallback((url: string) => {
    setIframePreviewUrl(url);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setIframePreviewUrl(null);
  }, []);

  // Test Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('🎯 Focusing on node from browser:', nodeId);
    if (focusNodeFn) {
      focusNodeFn(nodeId);
    }
  }, [focusNodeFn]);

  const handlePagePreview = useCallback((nodeId: string, url: string) => {
    console.log('🎯 Opening preview for:', url);
    // Open the preview
    handlePreviewOpen(url);
    // Focus on the node
    if (focusNodeFn) {
      focusNodeFn(nodeId);
    }
  }, [focusNodeFn, handlePreviewOpen]);

  const handleNodeSelection = useCallback((node: {
    id: string;
    url: string;
    title: string;
  } | null) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#F8FAFC]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#5B98D6]/20 bg-[#F8FAFC] px-3 py-1.5">
        <div className="flex items-center gap-4">
          {/* Atlas Logo - goes to dashboard */}
          <button
            onClick={() => router.push('/dashboard')}
            className="transition-opacity hover:opacity-70 pr-4 border-r border-[#5B98D6]/20"
          >
            <AtlasLogo size="lg"className="mt-1" />
          </button>

          {/* Breadcrumb */}
          <Breadcrumb
            projectId={projectId}
            selectedSitemap={selectedSitemap}
            selectedNode={selectedNode}
            onSelectSitemap={setSelectedSitemap}
            onSearchChange={handleSearchChange}
            onPageClick={handleNodeClick}
            onPagePreview={handlePagePreview}
            onProjectClick={() => setShowProjectSidebar(true)}
            openPagesRef={openPagesRef}
          />
        </div>
        {/* <div className="flex items-center gap-2">
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
        </div> */}
      </div>

      {/* Canvas + Preview Panel Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <SiteMapFlow 
            projectId={projectId}
            selectedSitemap={selectedSitemap}
            selectedLayout={selectedLayout}
            searchTerm={searchTerm}
            onSelectSitemap={setSelectedSitemap}
            onSelectLayout={setSelectedLayout}
            onBrowseSitemap={() => openPagesRef.current?.()}
            onFlowReady={handleFlowReady}
            onPreviewOpen={handlePreviewOpen}
            onFocusNode={handleFocusNode}
            onNodeSelection={handleNodeSelection}
          />
        </div>

        {/* Preview Panel */}
        <AnimatePresence>
          {iframePreviewUrl && (
            <IframePreviewPanel 
              url={iframePreviewUrl}
              onClose={handlePreviewClose}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Project Sidebar */}
      <ProjectSidebar
        isOpen={showProjectSidebar}
        onClose={() => setShowProjectSidebar(false)}
        currentProjectId={projectId}
      />
    </div>
  );
}

export default function CanvasPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CanvasContent />
    </Suspense>
  );
}
