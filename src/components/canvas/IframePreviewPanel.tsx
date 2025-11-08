'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, X, ZoomIn, ZoomOut, Globe } from 'lucide-react';

interface IframePreviewPanelProps {
  url: string | null;
  onClose: () => void;
}

const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1.0];

export function IframePreviewPanel({ url, onClose }: IframePreviewPanelProps) {
  const [width, setWidth] = useState(1000); // Wider default width
  const [isResizing, setIsResizing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.67); // Default 67% zoom
  const [iframeError, setIframeError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = startXRef.current - e.clientX;
      const maxWidth = window.innerWidth * 0.9; // Allow up to 90% of screen width
      const newWidth = Math.max(300, Math.min(maxWidth, startWidthRef.current + delta));
      setWidth(newWidth);
      
      // Ensure cursor stays as col-resize during drag
      document.body.style.cursor = 'col-resize';
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    // Set cursor and disable text selection while resizing
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none'; // Prevent interference from other elements

    document.addEventListener('mousemove', handleMouseMove, { capture: true, passive: false });
    document.addEventListener('mouseup', handleMouseUp, { capture: true, passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z >= zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z >= zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const handleZoomFit = () => {
    setZoomLevel(1.0);
  };

  // Reset error state when URL changes
  useEffect(() => {
    setIframeError(false);
  }, [url]);

  const handleIframeError = () => {
    setIframeError(true);
  };

  // Generate proxy URL to bypass X-Frame-Options
  const getProxyUrl = (originalUrl: string) => {
    if (!originalUrl) return '';
    try {
      // Only use proxy for http/https URLs
      const url = new URL(originalUrl);
      if (['http:', 'https:'].includes(url.protocol)) {
        return `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
      }
      return originalUrl;
    } catch {
      return originalUrl;
    }
  };

  if (!url) return null;

  return (
    <motion.div
      ref={panelRef}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: `${width}px`, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0 }}
      className="relative z-40 flex flex-col border-l-2 border-[#5B98D6]/30 bg-white shadow-2xl"
      style={{ minWidth: width > 0 ? `${width}px` : 0 }}
    >
        {/* Resize Handle - Much wider hit area */}
        <div
          className={`absolute -left-2 top-0 h-full w-8 cursor-col-resize ${
            isResizing ? 'bg-[#4863B0]/20' : 'hover:bg-[#4863B0]/10'
          }`}
          onMouseDown={handleResizeStart}
          style={{ zIndex: 50 }}
        >
          <div className="absolute left-3 top-1/2 h-12 w-0.5 -translate-y-1/2 bg-[#4863B0]/50 rounded-full" />
        </div>

        {/* Browser-style Header */}
        <div className="flex items-center justify-between border-b border-[#5B98D6]/20 bg-[#5B98D6]/20 px-3 py-2">
          <div className="flex-1 min-w-0 pr-3">
            {/* Browser-style URL bar */}
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-[#1a1a1a]/60" />
              <div className="flex-1 rounded-md bg-[#5B98D6]/10 px-2 py-1">
                <span className="text-[12px] text-[#1a1a1a]/70 truncate block">
                  {url} 
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 border-r border-[#5B98D6]/20 pr-2 mr-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= ZOOM_LEVELS[0]}
                className="flex h-7 w-7 items-center justify-center rounded text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0] disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleZoomFit}
                className="min-w-[48px] h-7 px-2 text-xs font-medium text-[#1a1a1a]/70 hover:bg-[#5B98D6]/10 rounded transition-colors"
                title="Reset zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                className="flex h-7 w-7 items-center justify-center rounded text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0] disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Open External */}
            <button
              onClick={() => window.open(url, '_blank')}
              className="flex h-7 w-7 items-center justify-center rounded text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            
            {/* Manual Fallback - Show error message if iframe doesn't load */}
            {!iframeError && (
              <button
                onClick={() => setIframeError(true)}
                className="flex h-7 items-center justify-center rounded px-2 text-xs text-[#1a1a1a]/50 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                title="If page doesn't load, click to see alternative options"
              >
                Page not loading?
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded text-[#1a1a1a]/60 transition-colors hover:bg-red-100 hover:text-red-600"
              title="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Iframe with Zoom or Error Fallback */}
        <div className="flex-1 overflow-hidden bg-[#DDEEF9]" ref={iframeContainerRef}>
          {iframeError ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-[#5B98D6]/10 p-4">
                <Globe className="h-8 w-8 text-[#4863B0]" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-[#1a1a1a]">
                Cannot display in preview
              </h3>
              <p className="mb-6 max-w-md text-sm text-[#1a1a1a]/60">
                This page cannot be displayed in a frame due to security restrictions (X-Frame-Options). 
                Click the button below to open it in a new tab.
              </p>
              <button
                onClick={() => window.open(url, '_blank')}
                className="flex items-center gap-2 rounded-lg bg-[#4863B0] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B98D6]"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </button>
            </div>
          ) : (
            <div 
              className="h-full w-full overflow-auto"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                width: `${100 / zoomLevel}%`,
                height: `${100 / zoomLevel}%`,
              }}
            >
              <iframe
                ref={iframeRef}
                src={getProxyUrl(url)}
                className="h-full w-full border-0"
                title="Page Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                onError={handleIframeError}
                onLoad={(e) => {
                  // Check if iframe loaded successfully after a short delay
                  // This gives time for X-Frame-Options errors to manifest
                  setTimeout(() => {
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentWindow) {
                        // Try to access contentDocument - will fail for cross-origin
                        // but that's OK, we just want to check if iframe exists
                        try {
                          // For same-origin, we can check document
                          const doc = iframe.contentWindow.document;
                          if (!doc || doc.body.children.length === 0) {
                            // Empty document might indicate blocking
                            // But we can't be sure, so don't auto-show error
                          }
                        } catch (crossOriginError) {
                          // Cross-origin is normal and fine
                          // Iframe loaded, just can't access content (expected)
                        }
                      }
                    } catch (error) {
                      // Iframe might be blocked, but we can't reliably detect
                      // User can click "Page not loading?" if needed
                    }
                  }, 1000);
                }}
              />
            </div>
          )}
        </div>
      </motion.div>
  );
}

