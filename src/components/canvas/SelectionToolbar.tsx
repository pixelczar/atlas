'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Maximize2, Minimize2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useMemo } from 'react';
import { useReactFlow } from 'reactflow';

interface SelectionToolbarProps {
  selectedNodes: any[];
  onToggleIframe?: () => void;
  onOpenExternal?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
}

export function SelectionToolbar({
  selectedNodes,
  onToggleIframe,
  onOpenExternal,
  onDelete,
  onToggleVisibility,
}: SelectionToolbarProps) {
  const { flowToScreenPosition } = useReactFlow();
  const hasSelection = selectedNodes.length > 0;
  const isSingleSelection = selectedNodes.length === 1;
  const hasHiddenNodes = selectedNodes.some(node => node.data?.isHidden);

  // Calculate position above selected nodes (centered above selection)
  const toolbarPosition = useMemo(() => {
    if (selectedNodes.length === 0) return { x: 0, y: 0 };

    // Calculate the bounding box of all selected nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedNodes.forEach(node => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      const width = 288; // Standard node width
      const height = 150; // Standard node height
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    // Calculate the center of the selection horizontally
    const selectionCenterX = minX + (maxX - minX) / 2;
    const selectionTopY = minY;
    
    // Position toolbar so its bottom edge is 16px above the selection's top edge
    // We need to account for the toolbar's actual height (~40px)
    const flowToolbarCenterX = selectionCenterX;
    const flowToolbarTopY = selectionTopY - 16 - 40; // 16px gap + toolbar height

    // Convert these flow coordinates to screen coordinates for absolute positioning
    const screenPosition = flowToScreenPosition({ x: flowToolbarCenterX, y: flowToolbarTopY });

    return {
      x: screenPosition.x,
      y: screenPosition.y,
    };
  }, [selectedNodes.length, selectedNodes.map(n => `${n.position?.x},${n.position?.y}`).join(','), flowToScreenPosition]);

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.16, 1, 0.3, 1]
          }}
          className="pointer-events-auto absolute z-30"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y,
            transform: 'translateX(-50%)', // Center the toolbar horizontally
          }}
        >
          <div 
            className="flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-xl shadow-[#4863B0]/10 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Selection count */}
            <div className="flex items-center gap-2 border-r border-[#5B98D6]/20 pr-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4863B0] text-xs font-medium text-white">
                {selectedNodes.length}
              </div>
              <span className="text-xs text-[#1a1a1a]/60">
                {selectedNodes.length === 1 ? 'node' : 'nodes'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Toggle iframe - only for single selection */}
              {isSingleSelection && onToggleIframe && (
                <motion.button
                  onClick={onToggleIframe}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                  title="Toggle preview"
                >
                  <Maximize2 className="h-4 w-4" />
                </motion.button>
              )}

              {/* Open external - only for single selection */}
              {isSingleSelection && onOpenExternal && (
                <motion.button
                  onClick={onOpenExternal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </motion.button>
              )}

              {/* Toggle visibility */}
              {onToggleVisibility && (
                <motion.button
                  onClick={onToggleVisibility}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                  title={hasHiddenNodes ? 'Show nodes' : 'Hide nodes'}
                >
                  {hasHiddenNodes ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </motion.button>
              )}

              {/* Delete */}
              {onDelete && (
                <motion.button
                  onClick={onDelete}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  title={`Delete ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`}
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

