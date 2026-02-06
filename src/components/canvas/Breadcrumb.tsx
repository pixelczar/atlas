'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Globe, FileText, Eye, EyeOff, Search, Maximize2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { doc, getDoc, collection, query, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface BreadcrumbProps {
  projectId: string;
  selectedSitemap: string;
  selectedNode?: {
    id: string;
    url: string;
    title: string;
  } | null;
  onSitemapClick?: () => void;
  onSelectSitemap?: (sitemap: string) => void;
  onSearchChange?: (searchTerm: string) => void;
  onPageClick?: (pageId: string) => void;
  onPagePreview?: (pageId: string, url: string) => void;
  onProjectClick?: () => void;
  onOpenPagesRequest?: () => void;
  openPagesRef?: React.MutableRefObject<(() => void) | null>;
}

interface PageItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  isHidden: boolean;
  lastModified?: Date;
}

export function Breadcrumb({ projectId, selectedSitemap, selectedNode, onSitemapClick, onSelectSitemap, onSearchChange, onPageClick, onPagePreview, onProjectClick, openPagesRef }: BreadcrumbProps) {
  const [projectName, setProjectName] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  const [showPages, setShowPages] = useState(false);
  // Keep track of last selected node to prevent "Pages" flash during transitions
  const lastSelectedNodeRef = useRef<BreadcrumbProps['selectedNode']>(null);
  const [showSitemaps, setShowSitemaps] = useState(false);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [sitemaps, setSitemaps] = useState<string[]>([]);
  const [sitemapCounts, setSitemapCounts] = useState<Record<string, number>>({});
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // Removed sort and filter controls - always show all pages
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate filtered pages - only text search, no status filtering or sorting
  const filteredPages = useMemo(() => {
    let filtered = pages.filter(page => {
      // Text search only
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = (
          page.title.toLowerCase().includes(query) ||
          page.url.toLowerCase().includes(query) ||
          (page.description && page.description.toLowerCase().includes(query))
        );
        if (!matchesText) return false;
      }
      
      return true;
    });
    
    // No sorting - show in original order
    return filtered;
  }, [pages, searchQuery]);

  // Always show all pages - no limit
  const displayedPages = useMemo(() => {
    return filteredPages;
  }, [filteredPages]);

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
      const displayedPagesCount = displayedPages.length;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < displayedPagesCount - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0) {
          // Open preview for selected page
          const selectedPage = displayedPages[selectedIndex];
          if (selectedPage && onPagePreview) {
            onPagePreview(selectedPage.id, selectedPage.url);
            setShowPages(false);
            setSearchQuery('');
          }
        } else if (displayedPages.length > 0) {
          // Open preview for first result if no selection
          const firstPage = displayedPages[0];
          if (firstPage && onPagePreview) {
            onPagePreview(firstPage.id, firstPage.url);
            setShowPages(false);
            setSearchQuery('');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPages, selectedIndex, displayedPages, onPageClick, onPagePreview]);

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
      // Firestore returned documents

      // Load hidden state from localStorage
      const storageKey = `atlas-hidden-pages-${projectId}`;
      const storedHidden = localStorage.getItem(storageKey);
      const hiddenPageIds = storedHidden ? new Set(JSON.parse(storedHidden)) : new Set();

      const pageList: PageItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url || '',
          title: data.title || 'Untitled',
          description: data.description || null,
          isHidden: hiddenPageIds.has(doc.id) || data.isHidden || false,
          // Removed status field
          lastModified: data.metadata?.lastModified?.toDate() || data.updatedAt?.toDate() || null,
        };
      });

      // Sort by URL
      pageList.sort((a, b) => a.url.localeCompare(b.url));
      // Loaded pages from Firestore
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
  
  // Expose function to open pages popover externally
  const openPages = useCallback(() => {
    if (!showPages && pages.length === 0) {
      fetchPages();
    }
    if (showPages) {
      setSearchQuery('');
    }
    setShowPages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPages, pages.length]);
  
  // Expose openPages function via ref
  useEffect(() => {
    if (openPagesRef) {
      openPagesRef.current = openPages;
    }
  }, [openPages, openPagesRef]);

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

  // Track the last known selected node to avoid flashing "Pages"
  useEffect(() => {
    if (selectedNode) {
      lastSelectedNodeRef.current = selectedNode;
    }
  }, [selectedNode]);

  // The node to display: use current, or keep showing last one during transition
  const displayNode = selectedNode || lastSelectedNodeRef.current;

  // Reset favicon loaded state when domain changes
  useEffect(() => {
    setFaviconLoaded(false);
  }, [domain]);

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
          <button
            onClick={onProjectClick}
            className="rounded-lg px-2 py-1 transition-colors hover:bg-[#4863B0]/10 hover:text-[#4863B0] font-medium text-[#4863B0] flex items-center gap-1.5"
          >
            <span className="relative h-4 w-4 flex-shrink-0">
              {domain ? (
                <>
                  {!faviconLoaded && (
                    <Globe className="absolute inset-0 h-4 w-4 text-[#4863B0]/40" />
                  )}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                    alt={`${domain} favicon`}
                    className={`h-4 w-4 rounded-sm transition-opacity duration-150 ${faviconLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setFaviconLoaded(true)}
                    onError={() => setFaviconLoaded(false)}
                  />
                </>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M9 9h6v6H9z" strokeWidth="2"/>
                  <path d="M3 9h6v6H3z" strokeWidth="2"/>
                </svg>
              )}
            </span>
            {domain || projectName}
          </button>

          <ChevronRight className="h-3 w-3 text-[#1a1a1a]/30" />

          {/* Sitemap Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setShowSitemaps(!showSitemaps)}
              className={`rounded-lg px-2 py-1 font-medium transition-colors hover:bg-[#4863B0]/10 hover:text-[#4863B0] ${
                showSitemaps ? 'bg-[#4863B0]/10 text-[#4863B0]' : 'text-[#4863B0]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{selectedSitemap}</span>
                <span className={`inline-flex items-center justify-center rounded-lg bg-[#4863B0]/10 px-1 py-0.5 text-[10px] font-medium min-w-5 transition-opacity duration-150 ${
                  sitemapCounts[selectedSitemap] ? 'text-[#4863B0] opacity-100' : 'opacity-0'
                }`}>
                  {sitemapCounts[selectedSitemap] || 0}
                </span>
              </span>
            </motion.button>
          </div>

          <ChevronRight className="h-3 w-3 text-[#1a1a1a]/30" />

          {/* Selected Node Path or Pages */}
          <AnimatePresence mode="wait" initial={false}>
            {displayNode ? (
              <motion.div
                key={displayNode.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex items-center gap-1.5"
              >
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={handlePagesClick}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-[#4863B0] transition-colors hover:bg-[#4863B0]/10 hover:text-[#4863B0]"
                    >
                      <Globe className="h-3 w-3" />
                      <span className="truncate max-w-[200px]" title={displayNode.title}>
                        {displayNode.title}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{displayNode.url}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ) : (
              <motion.div
                key="pages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={handlePagesClick}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors hover:bg-[#4863B0]/10 hover:text-[#4863B0] ${
                        showPages ? 'bg-[#4863B0]/10 text-[#4863B0]' : 'text-[#4863B0]'
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
            )}
          </AnimatePresence>
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
              className="absolute left-0 top-full z-50 mt-4 w-[28rem] rounded-xl border border-[#5B98D6]/20 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Search */}
              <div className="border-b border-[#5B98D6]/10 px-6 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-medium font-serif tracking-tight text-[#1a1a1a]">
                      Pages <span className="text-xs text-[#1a1a1a]/50 font-sans ml-2">{displayedPages.length}</span>

                    </h3>
                  </div>
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
                    className="w-full rounded-lg border border-[#5B98D6]/20 bg-[#DDEEF9]/30 py-2 pl-8 pr-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#4863B0] focus:outline-none focus:ring-1 focus:ring-[#4863B0]/20"
                  />
                </div>
                
                {/* Removed filter and sort controls */}
              </div>

              {/* Pages List */}
              <div className="max-h-[500px] overflow-y-auto">
                {isLoadingPages ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4863B0]/50 border-t-transparent" />
                    <p className="text-[10px] text-[#1a1a1a]/40">Loading pages...</p>
                  </div>
                ) : displayedPages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#1a1a1a]/40">
                    No pages found
                  </div>
                ) : (
                  <div className="divide-y divide-[#5B98D6]/10" ref={listRef}>
                    {displayedPages.map((page, index) => (
                      <motion.div
                        key={page.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.16 }}
                        className={`group flex items-center justify-between gap-2 px-6 py-2 transition-colors cursor-pointer ${
                          selectedIndex === index 
                            ? 'bg-yellow-200' 
                            : 'hover:bg-slate-50'
                        } ${page.isHidden ? 'opacity-40' : ''} ${
                          index === 0 ? 'rounded-t-lg' : ''
                        } ${
                          index === displayedPages.length - 1 ? 'rounded-b-lg' : ''
                        }`}
                        onClick={() => {
                          if (onPagePreview) {
                            onPagePreview(page.id, page.url);
                            setShowPages(false);
                            setSearchQuery('');
                          }
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-[#1a1a1a]">
                              {page.title}
                            </p>
                          </div>
                          {page.description && (
                            <p className="truncate text-[10px] text-[#1a1a1a]/60">
                              {page.description}
                            </p>
                          )}
                          <p className="truncate text-[11px] text-[#1a1a1a]/50" title={page.url}>
                            {page.url}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {/* Preview Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                              >
                                <Maximize2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Preview page</p>
                            </TooltipContent>
                          </Tooltip>

                          {/* Toggle Visibility Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePageVisibility(page.id);
                                }}
                                className="flex-shrink-0 rounded p-1 text-[#1a1a1a]/40 transition-colors hover:bg-yellow-100 hover:text-[#4863B0]"
                              >
                                {page.isHidden ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{page.isHidden ? 'Show page' : 'Hide page'}</p>
                            </TooltipContent>
                          </Tooltip>
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
              <div className="border-b border-[#5B98D6]/10 p-6">
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
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.16 }}
                      onClick={() => {
                        if (onSelectSitemap) {
                          onSelectSitemap(sitemap);
                        }
                        setShowSitemaps(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        selectedSitemap === sitemap
                          ? 'bg-yellow-200 text-[#4863B0] font-medium'
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

