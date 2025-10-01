'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Globe, FileText, Eye, EyeOff, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BreadcrumbProps {
  projectId: string;
  selectedSitemap: string;
  onSitemapClick?: () => void;
}

interface PageItem {
  id: string;
  url: string;
  title: string;
  isHidden: boolean;
}

export function Breadcrumb({ projectId, selectedSitemap, onSitemapClick }: BreadcrumbProps) {
  const [projectName, setProjectName] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [showPages, setShowPages] = useState(false);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  const filteredPages = pages.filter(page => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      page.title.toLowerCase().includes(query) ||
      page.url.toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative flex items-center gap-1.5 text-xs">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex items-center gap-1.5"
      >
        {/* Domain */}
        <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 backdrop-blur-sm">
          <Globe className="h-3 w-3 text-[#4863B0]" />
          <span className="font-medium text-[#1a1a1a]">{domain || projectName}</span>
        </div>

        <ChevronRight className="h-3 w-3 text-[#1a1a1a]/30" />

        {/* Sitemap Selector */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSitemapClick}
          className="rounded-lg bg-white/80 px-2 py-1 font-medium text-[#4863B0] backdrop-blur-sm transition-colors hover:bg-white"
        >
          {selectedSitemap}
        </motion.button>

        <ChevronRight className="h-3 w-3 text-[#1a1a1a]/30" />

        {/* Pages */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePagesClick}
          className={`flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 font-medium backdrop-blur-sm transition-colors hover:bg-white ${
            showPages ? 'text-[#4863B0]' : 'text-[#1a1a1a]'
          }`}
        >
          <FileText className="h-3 w-3" />
          <span>Pages</span>
          {hiddenCount > 0 && (
            <span className="text-[10px] text-[#1a1a1a]/40">({hiddenCount} hidden)</span>
          )}
        </motion.button>
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
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-[#5B98D6]/20 bg-[#DDEEF9]/30 py-1.5 pl-8 pr-3 text-xs text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#4863B0] focus:outline-none focus:ring-1 focus:ring-[#4863B0]/20"
                  />
                </div>
              </div>

              {/* Pages List */}
              <div className="max-h-96 overflow-y-auto">
                {isLoadingPages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4863B0] border-t-transparent" />
                  </div>
                ) : filteredPages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#1a1a1a]/40">
                    No pages found
                  </div>
                ) : (
                  <div className="divide-y divide-[#5B98D6]/10">
                    {filteredPages.map((page, index) => (
                      <motion.div
                        key={page.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.15 }}
                        className={`group flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-[#5B98D6]/5 ${
                          page.isHidden ? 'opacity-40' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-[#1a1a1a]">
                            {page.title}
                          </p>
                          <p className="truncate text-[11px] text-[#1a1a1a]/50" title={page.url}>
                            {page.url}
                          </p>
                        </div>

                        {/* Toggle Button */}
                        <button
                          onClick={() => togglePageVisibility(page.id)}
                          className="flex-shrink-0 rounded p-1 text-[#1a1a1a]/40 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                          title={page.isHidden ? 'Show page' : 'Hide page'}
                        >
                          {page.isHidden ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

