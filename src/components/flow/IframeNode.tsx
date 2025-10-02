'use client';

import { memo, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Loader2, Maximize2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface IframeNodeData {
  label: string;
  url: string;
  thumbnailUrl?: string;
  isLoading?: boolean;
  status?: 'pending' | 'ready';
  isHidden?: boolean;
  isHighlighted?: boolean;
  searchTerm?: string;
  onDelete?: (nodeId: string) => void;
  onToggleIframe?: () => void;
  onOpenExternal?: () => void;
  onToggleVisibility?: () => void;
}

function IframeNode({ data, id, selected }: NodeProps<IframeNodeData>) {
  const [showIframe, setShowIframe] = useState(false);
  const isHidden = data.isHidden;

  // Memoize expensive calculations
  const pageTitle = useMemo(() => {
    // If label exists and is not "Untitled", use it
    if (data.label && data.label !== 'Untitled') {
      return data.label;
    }

    try {
      const urlObj = new URL(data.url);
      const pathname = urlObj.pathname;
      
      // If it's the homepage
      if (pathname === '/' || pathname === '') {
        return 'Home';
      }
      
      // Get the last segment of the path
      const segments = pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      if (lastSegment) {
        // Convert slug to title case (e.g., "about-us" -> "About Us")
        return lastSegment
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      return 'Page';
    } catch {
      return data.label || 'Page';
    }
  }, [data.label, data.url]);

  const domain = useMemo(() => {
    try {
      return new URL(data.url).hostname.replace('www.', '');
    } catch {
      return data.url;
    }
  }, [data.url]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isHidden ? 0.3 : 1,
      }}
      transition={{ 
        opacity: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
      }}
      className={`group relative rounded-xl border-2 bg-white shadow-lg transition-all ${
        selected 
          ? 'border-[#4863B0] shadow-[#4863B0]/20 ring-2 ring-[#4863B0]/20' 
          : data.isHighlighted
            ? 'border-[#FFD700] shadow-[#FFD700]/30 ring-2 ring-[#FFD700]/20 bg-yellow-50'
            : 'border-[#5B98D6]/40 hover:border-[#4863B0]/60'
      }`}
      style={{ 
        width: 288,
        imageRendering: 'crisp-edges',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#4863B0]"
      />

      <div className="flex flex-col overflow-hidden rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5B98D6]/10 bg-gradient-to-br from-[#5B98D6]/5 to-transparent px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[#1a1a1a]">
              {pageTitle}
            </p>
            <p className="truncate text-[10px] text-[#1a1a1a]/40" title={data.url}>
              {data.url}
            </p>
          </div>
        </div>

        {/* Selection Toolbar - Fixed size, positioned inside card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute top-2 right-2 z-10"
              style={{
                // Fixed size regardless of zoom level
                transform: 'scale(1)',
                transformOrigin: 'top right',
                willChange: 'transform, opacity',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <TooltipProvider>
                <div 
                  className="flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 shadow-lg shadow-[#4863B0]/10 backdrop-blur-sm"
                  style={{
                    imageRendering: 'crisp-edges',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                >
                  {/* Toggle iframe */}
                  {data.onToggleIframe && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={data.onToggleIframe}
                          className="flex h-6 w-6 items-center justify-center rounded text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                          style={{
                            willChange: 'background-color, color',
                          }}
                        >
                          <Maximize2 className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle preview</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Open external */}
                  {data.onOpenExternal && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={data.onOpenExternal}
                          className="flex h-6 w-6 items-center justify-center rounded text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                          style={{
                            willChange: 'background-color, color',
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open in new tab</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Toggle visibility */}
                  {data.onToggleVisibility && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={data.onToggleVisibility}
                          className="flex h-6 w-6 items-center justify-center rounded text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                          style={{
                            willChange: 'background-color, color',
                          }}
                        >
                          {isHidden ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isHidden ? 'Show node' : 'Hide node'}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Delete button removed - doesn't make sense in this context */}
                </div>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#DDEEF9] to-[#DDEEF9]/80">
          {data.status === 'pending' || data.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="h-5 w-5 text-[#4863B0]" />
                </motion.div>
                <p className="text-[10px] text-[#1a1a1a]/50">
                  {data.status === 'pending' ? 'Generating screenshot...' : 'Loading...'}
                </p>
              </motion.div>
            </div>
          ) : showIframe ? (
            <iframe
              src={data.url}
              className="h-full w-full border-0"
              title={data.label}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : data.thumbnailUrl ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              src={data.thumbnailUrl}
              alt={data.label}
              className="h-full w-full object-cover"
              style={{
                imageRendering: 'crisp-edges',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-[#1a1a1a]/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#5B98D6]/20 bg-white">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <p className="text-[10px]">No preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#4863B0]"
      />
    </motion.div>
  );
}

export default memo(IframeNode, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.label === nextProps.data.label &&
    prevProps.data.url === nextProps.data.url &&
    prevProps.data.thumbnailUrl === nextProps.data.thumbnailUrl &&
    prevProps.data.status === nextProps.data.status &&
    prevProps.data.isHidden === nextProps.data.isHidden &&
    prevProps.data.isHighlighted === nextProps.data.isHighlighted &&
    prevProps.data.searchTerm === nextProps.data.searchTerm
  );
});
