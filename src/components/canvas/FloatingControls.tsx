'use client';

import { Grid, RotateCcw, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingControlsProps {
  onRegrid: () => void;
  onFitView: () => void;
  onToggleHide: () => void;
  selectedNodes: any[];
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView?: () => void;
}

export function FloatingControls({ 
  onRegrid, 
  onFitView, 
  onToggleHide,
  selectedNodes,
  onZoomIn, 
  onZoomOut, 
  onResetView 
}: FloatingControlsProps) {
  const hasSelectedNodes = selectedNodes.length > 0;
  const hasHiddenNodes = selectedNodes.some(node => node.data?.isHidden);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm shadow-lg px-2 py-1 transition-all duration-300 ease-in-out">
        {/* Zoom Controls */}
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors duration-200 ease-in-out [&_svg]:!h-6 [&_svg]:!w-6"
          onClick={onZoomIn}
          title="Zoom in"
        >
          <ZoomIn />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors duration-200 ease-in-out [&_svg]:!h-6 [&_svg]:!w-6"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <ZoomOut />
        </Button>
        
        <div className="h-5 w-px bg-gray-300/60" />
        
        {/* Grid and Fit Controls */}
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors duration-200 ease-in-out [&_svg]:!h-6 [&_svg]:!w-6"
          onClick={onRegrid}
          title="Re-grid all nodes"
        >
          <Grid />
        </Button>
        
        <div className="h-5 w-px bg-gray-300/60" />
        
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors duration-200 ease-in-out [&_svg]:!h-6 [&_svg]:!w-6"
          onClick={onFitView}
          title="Fit view to content"
        >
          <Maximize2 />
        </Button>
        
        {hasSelectedNodes && (
          <>
            <div className="h-5 w-px bg-gray-300/60" />
            <Button
              size="icon"
              variant="ghost"
              className={`h-10 w-10 hover:bg-gray-100/80 transition-colors duration-200 ease-in-out [&_svg]:!h-6 [&_svg]:!w-6 ${hasHiddenNodes ? 'text-orange-600 hover:text-orange-700' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={onToggleHide}
              title={hasHiddenNodes ? "Show selected nodes" : "Hide selected nodes"}
            >
              {hasHiddenNodes ? <Eye /> : <EyeOff />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
