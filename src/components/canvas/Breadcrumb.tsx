'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Globe, FileText, Eye, EyeOff, Search, Maximize2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, collection, query, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface BreadcrumbProps {
  projectId: string;
  selectedSitemap: string;
  onSitemapClick?: () => void;
  onSelectSitemap?: (sitemap: string) => void;
  onSearchChange?: (searchTerm: string) => void;
  onPageClick?: (pageId: string) => void;
  onPagePreview?: (pageId: string, url: string) => void;
}

interface PageItem {
  id: string;
  url: string;
  title: string;
  isHidden: boolean;
}

export function Breadcrumb({ projectId, selectedSitemap, onSitemapClick, onSelectSitemap, onSearchChange, onPageClick, onPagePreview }: BreadcrumbProps) {
  const [projectName, setProjectName] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [showPages, setShowPages] = useState(false);
  const [showSitemaps, setShowSitemaps] = useState(false);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [sitemaps, setSitemaps] = useState<string[]>([]);
  const [sitemapCounts, setSitemapCounts] = useState<Record<string, number>>({});
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate filtered pages
  const filteredPages = useMemo(() => {
    const filtered = pages.filter(page => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        page.title.toLowerCase().includes(query) ||
        page.url.toLowerCase().includes(query)
      );
    });
    console.log('📊 Breadcrumb: Filtered pages count:', filtered.length, 'of', pages.length, 'total');
    return filtered;
  }, [pages, searchQuery]);

  // Auto-focus search input when Pages dropdown opens
  useEffect(() => {
    if (showPages && searchInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      setSelectedIndex(-1);
    } else {
      setSelectedIndex(-1);
    }
  }, [showPages]);


  // Global keyboard shortcut: Cmd+K / Ctrl+K to open Pages menu
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!showPages && pages.length === 0) {
          fetchPages();
        }
        if (showPages) {
          setSearchQuery('');
        }
        setShowPages(!showPages);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showPages, pages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!showPages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const filteredPagesCount = filteredPages.length;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPagesCount - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selectedPage = filteredPages[selectedIndex];
        if (selectedPage && onPageClick) {
          onPageClick(selectedPage.id);
          setShowPages(false);
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPages, selectedIndex, filteredPages, onPageClick]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !db) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data = projectSnap.data();
          setProjectName(data.name || 'Project');
          setDomain(data.domain || '');
          // Load sitemaps list
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
        console.error('Error fetching project:', error);
      }
    };

    fetchProject();
  }, [projectId]);

  const fetchPages = async () => {
    if (!projectId || !db || pages.length > 0) return;
    
    setIsLoadingPages(true);
    try {
      const nodesRef = collection(db, `projects/${projectId}/nodes`);
      const q = query(nodesRef);
      const snapshot = await getDocs(q);
      console.log('📊 Breadcrumb: Firestore returned', snapshot.docs.length, 'documents');

      // Load hidden state from localStorage
      const storageKey = `atlas-hidden-pages-${projectId}`;
      const storedHidden = localStorage.getItem(storageKey);
      const hiddenPageIds = storedHidden ? new Set(JSON.parse(storedHidden)) : new Set();

      const pageList: PageItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        url: doc.data().url || '',
        title: doc.data().title || 'Untitled',
        isHidden: hiddenPageIds.has(doc.id) || doc.data().isHidden || false,
      }));

      // Sort by URL
      pageList.sort((a, b) => a.url.localeCompare(b.url));
      console.log('📊 Breadcrumb: Loaded', pageList.length, 'pages from Firestore');
      setPages(pageList);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handlePagesClick = () => {
    if (!showPages && pages.length === 0) {
      fetchPages();
    }
    if (showPages) {
      // Clear search when closing
      setSearchQuery('');
    }
    setShowPages(!showPages);
  };

  const togglePageVisibility = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const newHiddenState = !page.isHidden;

    // Optimistically update UI
    const updatedPages = pages.map(p => 
      p.id === pageId ? { ...p, isHidden: newHiddenState } : p
    );
    setPages(updatedPages);

    // Save to localStorage
    const storageKey = `atlas-hidden-pages-${projectId}`;
    const hiddenPageIds = updatedPages.filter(p => p.isHidden).map(p => p.id);
    localStorage.setItem(storageKey, JSON.stringify(hiddenPageIds));

    // Update Firestore
    try {
      const nodeRef = doc(db, `projects/${projectId}/nodes`, pageId);
      await updateDoc(nodeRef, { isHidden: newHiddenState });
    } catch (error) {
      console.error('Error updating page visibility:', error);
      // Revert on error
      setPages(pages.map(p => 
        p.id === pageId ? { ...p, isHidden: page.isHidden } : p
      ));
      // Revert localStorage
      const hiddenPageIds = pages.filter(p => p.isHidden).map(p => p.id);
      localStorage.setItem(storageKey, JSON.stringify(hiddenPageIds));
    }
  };

  const hiddenCount = pages.filter(p => p.isHidden).length;

  // Detect OS for keyboard shortcut display
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  const handleSitemapClick = (sitemap: string) => {
    if (onSitemapClick) {
      onSitemapClick();
    }
    setShowSitemaps(!showSitemaps);
  };

  return (
    <TooltipProvider>
      <div className="relative flex items-center gap-1.5 text-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex items-center gap-1.5"
        >
          {/* Domain */}
          <div className="rounded-lg px-2 py-1 transition-colors">
            <span className="font-medium text-gray-700">{domain || projectName}</span>
          </div>

          <ChevronRight className="h-3 w-3 text-[#1a1a1a]/30" />

          {/* Sitemap Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setShowSitemaps(!showSitemaps)}
              className={`rounded-lg px-2 py-1 font-medium transition-colors hover:bg-white/80 ${
                showSitemaps ? 'bg-white/80 text-[#4863B0]' : 'text-[#4863B0]'
              }`}
            >
              {selectedSitemap}
            </motion.button>
          </div>

          <ChevronRight className="h-3 w-3 text-[#1a1a1a]/30" />

          {/* Pages */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <motion.button
                onClick={handlePagesClick}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors hover:bg-white/80 ${
                  showPages ? 'bg-white/80 text-[#4863B0]' : 'text-[#4863B0]'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Pages</span>
                {hiddenCount > 0 && (
                  <span className="text-[10px] text-[#1a1a1a]/40">({hiddenCount} hidden)</span>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Search pages <span className="ml-1 text-xs opacity-70">{shortcutKey}</span></p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

      {/* Pages Panel */}
      <AnimatePresence>
        {showPages && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setShowPages(false);
                setSearchQuery('');
              }}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 w-[28rem] rounded-xl border border-[#5B98D6]/20 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Search */}
              <div className="border-b border-[#5B98D6]/10 px-3 py-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#4863B0]">
                    Pages ({filteredPages.length})
                  </span>
                  {hiddenCount > 0 && (
                    <span className="text-[10px] text-[#1a1a1a]/50">
                      {hiddenCount} hidden
                    </span>
                  )}
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1a1a1a]/40" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      
                      // Debounce search to avoid excessive updates
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }
                      
                      searchTimeoutRef.current = setTimeout(() => {
                        onSearchChange?.(e.target.value);
                      }, 300); // 300ms delay
                    }}
                    className="w-full rounded-lg border border-[#5B98D6]/20 bg-[#DDEEF9]/30 py-1.5 pl-8 pr-3 text-xs text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#4863B0] focus:outline-none focus:ring-1 focus:ring-[#4863B0]/20"
                  />
                </div>
              </div>

              {/* Pages List */}
              <div className="max-h-96 overflow-y-auto">
                {isLoadingPages ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4863B0] border-t-transparent" />
                    <p className="text-[10px] text-[#1a1a1a]/40">Loading pages...</p>
                  </div>
                ) : filteredPages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#1a1a1a]/40">
                    No pages found
                  </div>
                ) : (
                  <div className="divide-y divide-[#5B98D6]/10" ref={listRef}>
                    {filteredPages.map((page, index) => (
                      <motion.div
                        key={page.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.16 }}
                        className={`group flex items-center justify-between gap-2 px-3 py-2 transition-colors cursor-pointer ${
                          selectedIndex === index 
                            ? 'bg-yellow-200 border-l-4 border-yellow-500' 
                            : 'hover:bg-slate-50'
                        } ${page.isHidden ? 'opacity-40' : ''}`}
                        onClick={() => {
                          if (onPageClick) {
                            onPageClick(page.id);
                            setShowPages(false);
                            setSearchQuery('');
                          }
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-[#1a1a1a]">
                            {page.title}
                          </p>
                          <p className="truncate text-[11px] text-[#1a1a1a]/50" title={page.url}>
                            {page.url}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {/* Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPagePreview) {
                                onPagePreview(page.id, page.url);
                                setShowPages(false);
                                setSearchQuery('');
                              }
                            }}
                            className="flex-shrink-0 rounded p-1 text-[#1a1a1a]/40 hover:bg-yellow-100 hover:text-[#4863B0] transition-all"
                            title="Preview page"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Toggle Visibility Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePageVisibility(page.id);
                            }}
                            className="flex-shrink-0 rounded p-1 text-[#1a1a1a]/40 transition-colors hover:bg-yellow-100 hover:text-[#4863B0]"
                            title={page.isHidden ? 'Show page' : 'Hide page'}
                          >
                            {page.isHidden ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sitemap Selector Panel */}
      <AnimatePresence>
        {showSitemaps && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSitemaps(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#5B98D6]/20 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-[#5B98D6]/10 px-3 py-2.5">
                <span className="text-xs font-medium text-[#4863B0]">
                  Sitemaps ({sitemaps.length})
                </span>
              </div>

              {/* Sitemaps List */}
              <div className="max-h-80 overflow-y-auto p-2">
                {sitemaps.map((sitemap, index) => {
                  const count = sitemapCounts[sitemap] || 0;
                  return (
                    <motion.button
                      key={sitemap}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.15 }}
                      onClick={() => {
                        if (onSelectSitemap) {
                          onSelectSitemap(sitemap);
                        }
                        setShowSitemaps(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        selectedSitemap === sitemap
                          ? 'bg-yellow-200 text-[#4863B0] font-medium border-l-4 border-yellow-500'
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
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4863B0]"
                          />
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
    </TooltipProvider>
  );
}

