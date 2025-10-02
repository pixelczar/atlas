'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, FileText, ChevronDown, Check, List, Grid3x3, Columns, CircleDot, Sparkles, GitBranch, LayoutGrid, Network } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LayoutType } from '@/lib/layout-algorithms';

interface FloatingControlsProps {
  projectId: string;
  selectedSitemap: string;
  selectedLayout: LayoutType;
  onSelectSitemap: (sitemap: string) => void;
  onSelectLayout: (layout: LayoutType) => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBrowseSitemap?: () => void;
}

export function FloatingControls({ 
  projectId,
  selectedSitemap,
  selectedLayout,
  onSelectSitemap,
  onSelectLayout,
  onFitView, 
  onZoomIn, 
  onZoomOut, 
  onBrowseSitemap,
}: FloatingControlsProps) {
  const [sitemaps, setSitemaps] = useState<string[]>([]);
  const [sitemapCounts, setSitemapCounts] = useState<Record<string, number>>({});
  const [isSitemapOpen, setIsSitemapOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  useEffect(() => {
    const fetchSitemaps = async () => {
      if (!projectId || !db) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data = projectSnap.data();
          const sitemapList = data.sitemaps || [];
          setSitemaps(['All Sitemaps', ...sitemapList]);
          
          // Fetch nodes to count URLs per sitemap
          const nodesRef = collection(db, `projects/${projectId}/nodes`);
          const nodesSnapshot = await getDocs(query(nodesRef));
          
          const counts: Record<string, number> = { 'All Sitemaps': nodesSnapshot.size };
          
          nodesSnapshot.docs.forEach(doc => {
            const sitemapSource = doc.data().sitemapSource || 'sitemap.xml';
            counts[sitemapSource] = (counts[sitemapSource] || 0) + 1;
          });
          
          setSitemapCounts(counts);
        }
      } catch (error) {
        console.error('Error fetching sitemaps:', error);
      }
    };

    fetchSitemaps();
  }, [projectId]);

  const showSitemapSelector = sitemaps.length > 1;

  const layoutOptions: { value: LayoutType; label: string; icon: any }[] = [
    { value: 'grid', label: 'Grid', icon: Grid3x3 },
    { value: 'tree', label: 'Tree', icon: GitBranch },
    { value: 'dagre', label: 'Dagre', icon: Network },
  ];

  const currentLayout = layoutOptions.find(l => l.value === selectedLayout) || layoutOptions[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center"
    >
      <div 
        className="pointer-events-auto flex items-center gap-2 rounded-2xl  bg-white/95 px-3 py-2 shadow-xl shadow-[#4863B0]/10 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Layout Switcher */}
        <div className="relative">
          <motion.button
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1a1a1a] transition-colors hover:bg-[#5B98D6]/10"
            title="Change layout"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-[#4863B0]" />
            <span className="font-medium">{currentLayout.label}</span>
            <ChevronDown className={`h-3 w-3 text-[#1a1a1a]/60 transition-transform ${isLayoutOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isLayoutOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsLayoutOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-0 mb-2 min-w-[180px] rounded-xl border border-[#5B98D6]/20 bg-white/95 backdrop-blur-sm shadow-xl shadow-[#4863B0]/10 z-20"
                >
                  <div className="p-2">
                    {layoutOptions.map((layout, index) => {
                      const Icon = layout.icon;
                      return (
                        <motion.button
                          key={layout.value}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            onSelectLayout(layout.value);
                            setIsLayoutOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                            selectedLayout === layout.value
                              ? 'bg-[#5B98D6]/10 text-[#4863B0] font-medium'
                              : 'text-[#1a1a1a] hover:bg-[#5B98D6]/5'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="flex-1">{layout.label}</span>
                          {selectedLayout === layout.value && (
                            <Check className="h-3 w-3 text-[#4863B0]" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-[#5B98D6]/20" />

        {/* Sitemap Selector (only if multiple sitemaps) */}
        {showSitemapSelector && (
          <>
            <div className="relative">
              <motion.button
                onClick={() => setIsSitemapOpen(!isSitemapOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1a1a1a] transition-colors hover:bg-[#5B98D6]/10"
                title="Switch sitemap view"
              >
                <span className="max-w-[120px] truncate font-medium">{selectedSitemap}</span>
                <ChevronDown className={`h-3 w-3 text-[#1a1a1a]/60 transition-transform ${isSitemapOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isSitemapOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsSitemapOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-0 mb-2 min-w-[200px] rounded-xl border border-[#5B98D6]/20 bg-white/95 backdrop-blur-sm shadow-xl shadow-[#4863B0]/10 z-20"
                    >
                      <div className="p-2">
                        {sitemaps.map((sitemap, index) => {
                          const count = sitemapCounts[sitemap] || 0;
                          return (
                            <motion.button
                              key={sitemap}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => {
                                onSelectSitemap(sitemap);
                                setIsSitemapOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                                selectedSitemap === sitemap
                                  ? 'bg-[#5B98D6]/10 text-[#4863B0] font-medium'
                                  : count === 0
                                    ? 'text-[#1a1a1a]/30 cursor-not-allowed'
                                    : 'text-[#1a1a1a] hover:bg-[#5B98D6]/5'
                              }`}
                              disabled={count === 0}
                            >
                              <span className="truncate">{sitemap}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${
                                  selectedSitemap === sitemap 
                                    ? 'text-[#4863B0]' 
                                    : count === 0
                                      ? 'text-[#1a1a1a]/30'
                                      : 'text-[#1a1a1a]/50'
                                }`}>
                                  {count}
                                </span>
                                {selectedSitemap === sitemap && (
                                  <Check className="h-3 w-3 flex-shrink-0 text-[#4863B0]" />
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-[#5B98D6]/20" />
          </>
        )}

        {/* Browse Sitemap (XML List) */}
        {onBrowseSitemap && (
          <>
            <motion.button
              onClick={onBrowseSitemap}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
              title="Browse all URLs"
            >
              <List className="h-4 w-4" />
            </motion.button>

            {/* Divider */}
            <div className="h-5 w-px bg-[#5B98D6]/20" />
          </>
        )}

        {/* Zoom In */}
        <motion.button
          onClick={onZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </motion.button>

        {/* Zoom Out */}
        <motion.button
          onClick={onZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </motion.button>

        {/* Divider */}
        <div className="h-5 w-px bg-[#5B98D6]/20" />

        {/* Fit View */}
        <motion.button
          onClick={onFitView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/60 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
          title="Center and fit all nodes in view"
        >
          <Maximize2 className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
