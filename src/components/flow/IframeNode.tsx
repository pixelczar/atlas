'use client';

import { memo, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Loader2, Maximize2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDominantColor } from '@/hooks/useDominantColor';

export interface IframeNodeData {
  label: string;
  url: string;
  thumbnailUrl?: string;
  title?: string | null;
  description?: string | null;
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
      const hostname = new URL(data.url).hostname;
      // Remove 'www.' prefix if present
      const cleanDomain = hostname.replace(/^www\./, '');
      console.log(`🌐 Extracted domain for ${data.url}: ${cleanDomain}`);
      return cleanDomain;
    } catch {
      console.warn(`⚠️ Failed to parse URL: ${data.url}`);
      return data.url;
    }
  }, [data.url]);

  // Use the EXACT same favicon URL as breadcrumb (we know this works!)
  const faviconUrl = useMemo(() => {
    if (!domain) return null;
    // Use Google favicon service - same as breadcrumb
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }, [domain]);
  
  const dominantColor = useDominantColor(faviconUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isHidden ? 0.3 : 1,
      }}
      transition={{ 
        opacity: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
      }}
      className={`group relative rounded-2xl border-2 bg-white shadow-lg transition-all ${
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

      <div className="flex flex-col overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5B98D6]/10 bg-gradient-to-br from-[#5B98D6]/5 to-transparent px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-medium text-[#1a1a1a]">
              {data.title || pageTitle}
            </p>
            <p className="truncate text-[12px] text-[#1a1a1a]/40" title={data.url}>
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
        <div className="relative h-36 overflow-hidden bg-[#5B98D6]/20">
          {showIframe ? (
            <iframe
              src={data.url}
              className="h-full w-full border-0"
              title={data.label}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              {faviconUrl ? (
                <>
                  {/* Blurred background favicon */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${faviconUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      filter: 'blur(24px) saturate(1.8) brightness(1.1)',
                      transform: 'scale(1.3)',
                      opacity: 0.25,
                    }}
                  />
                  
                  {/* Color overlay using dominant color */}
                  {dominantColor && (
                    <div 
                      className="absolute inset-0 mix-blend-multiply"
                      style={{
                        backgroundColor: dominantColor,
                        opacity: 0.4,
                      }}
                    />
                  )}
                  
                  {/* Subtle gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5" />
                  
                  {/* Foreground favicon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="rounded-xl bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                      <img
                        src={faviconUrl}
                        alt=""
                        className="h-14 w-14 rounded-lg object-contain"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          console.error('Failed to load favicon:', faviconUrl);
                          // Fallback to letter if image fails
                          const parent = (e.target as HTMLElement).closest('.relative');
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex h-full w-full items-center justify-center rounded-lg text-white text-2xl font-bold" style="background: linear-gradient(135deg, #4863B0, #5B98D6)">
                                ${domain.charAt(0).toUpperCase()}
                              </div>
                            `;
                          }
                        }}
                        style={{
                          imageRendering: 'auto',
                          backfaceVisibility: 'hidden',
                          transform: 'translateZ(0)',
                          willChange: 'transform',
                          WebkitBackfaceVisibility: 'hidden',
                          WebkitTransform: 'translateZ(0)',
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div 
                  className="flex h-full w-full items-center justify-center rounded-lg text-white text-2xl font-bold"
                  style={{
                    background: dominantColor 
                      ? `linear-gradient(135deg, ${dominantColor}, ${dominantColor}dd)`
                      : 'linear-gradient(135deg, #4863B0, #5B98D6)',
                  }}
                >
                  {domain.charAt(0).toUpperCase()}
                </div>
              )}
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
