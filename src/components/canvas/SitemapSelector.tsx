'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText, Check } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SitemapSelectorProps {
  projectId: string;
  selectedSitemap: string;
  onSelectSitemap: (sitemap: string) => void;
}

export function SitemapSelector({
  projectId,
  selectedSitemap,
  onSelectSitemap,
}: SitemapSelectorProps) {
  const [sitemaps, setSitemaps] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
        }
      } catch (error) {
        console.error('Error fetching sitemaps:', error);
      }
    };

    fetchSitemaps();
  }, [projectId]);

  if (sitemaps.length <= 1) {
    return null; // Don't show if only one sitemap
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-[#5B98D6]/20 bg-white/95 px-4 py-2 text-sm text-[#1a1a1a] backdrop-blur-sm shadow-lg shadow-[#4863B0]/10 transition-colors hover:border-[#4863B0]/40"
      >
        <FileText className="h-4 w-4 text-[#4863B0]" />
        <span className="font-medium">{selectedSitemap}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#1a1a1a]/60 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 top-full z-20 mt-2 min-w-[240px] rounded-xl border border-[#5B98D6]/20 bg-white/95 backdrop-blur-sm shadow-xl shadow-[#4863B0]/10"
            >
              <div className="p-2">
                {sitemaps.map((sitemap, index) => (
                  <motion.button
                    key={sitemap}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      onSelectSitemap(sitemap);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedSitemap === sitemap
                        ? 'bg-[#5B98D6]/10 text-[#4863B0] font-medium'
                        : 'text-[#1a1a1a] hover:bg-[#5B98D6]/5'
                    }`}
                  >
                    <span>{sitemap}</span>
                    {selectedSitemap === sitemap && (
                      <Check className="h-4 w-4 text-[#4863B0]" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

