'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { Download, Share2 } from 'lucide-react';
import { SitemapBrowser } from '@/components/projects/SitemapBrowser';
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
  const projectId = searchParams.get('project') || 'demo-project';
  
  const [selectedSitemap, setSelectedSitemap] = useState('All Sitemaps');
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('dagre');
  const [showBrowser, setShowBrowser] = useState(false);
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [iframePreviewUrl, setIframePreviewUrl] = useState<string | null>(null);
  const [focusNodeFn, setFocusNodeFn] = useState<((nodeId: string) => void) | null>(null);

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

  return (
    <div className="flex h-screen flex-col bg-[#DDEEF9]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#5B98D6]/20 bg-[#DDEEF9] px-3 py-1.5">
        <div className="flex items-center gap-4">
          {/* Atlas Logo - triggers sidebar */}
          <button
            onClick={() => setShowProjectSidebar(true)}
            className="transition-opacity hover:opacity-70"
          >
            <AtlasLogo size="md" />
          </button>

          {/* Breadcrumb */}
          <Breadcrumb
            projectId={projectId}
            selectedSitemap={selectedSitemap}
            onSitemapClick={() => setShowBrowser(true)}
            onSelectSitemap={setSelectedSitemap}
            onSearchChange={handleSearchChange}
            onPageClick={handleNodeClick}
            onPagePreview={handlePagePreview}
          />
        </div>
        <div className="flex items-center gap-2">
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
            onBrowseSitemap={() => setShowBrowser(true)}
            onFlowReady={handleFlowReady}
            onPreviewOpen={handlePreviewOpen}
            onFocusNode={handleFocusNode}
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

      {/* Sitemap Browser Modal */}
      <SitemapBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        projectId={projectId}
        onNodeClick={handleNodeClick}
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

export default function CanvasPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CanvasContent />
    </Suspense>
  );
}
