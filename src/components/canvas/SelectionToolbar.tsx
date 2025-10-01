'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Maximize2, Minimize2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useMemo } from 'react';

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
  const hasSelection = selectedNodes.length > 0;
  const isSingleSelection = selectedNodes.length === 1;
  const hasHiddenNodes = selectedNodes.some(node => node.data?.isHidden);

  // Calculate position near selected nodes (appears to the right of selection)
  const toolbarPosition = useMemo(() => {
    if (selectedNodes.length === 0) return { x: 0, y: 0 };

    // Find the rightmost and topmost selected node
    const positions = selectedNodes.map(node => ({
      x: node.position?.x || 0,
      y: node.position?.y || 0,
    }));

    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));

    // Position toolbar to the right of the rightmost node
    return {
      x: maxX + 320, // Card width (288) + some margin
      y: minY,
    };
  }, [selectedNodes]);

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: toolbarPosition.x,
            y: toolbarPosition.y,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto absolute z-50"
        >
          <div 
            className="flex items-center gap-2 rounded-2xl border border-[#5B98D6]/20 bg-white/95 px-3 py-2 shadow-xl shadow-[#4863B0]/10 backdrop-blur-sm"
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
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
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
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
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
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
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
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
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

