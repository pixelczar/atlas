'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Search, Grid3x3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface SitemapBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

export function SitemapBrowser({
  isOpen,
  onClose,
  projectId,
  projectName = 'Project',
}: SitemapBrowserProps) {
  const router = useRouter();
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen || !projectId) return;

    const fetchNodes = async () => {
      try {
        const nodesRef = collection(db, `projects/${projectId}/nodes`);
        const q = query(nodesRef);
        const snapshot = await getDocs(q);
        
        const nodesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setNodes(nodesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching nodes:', error);
        setLoading(false);
      }
    };

    fetchNodes();
  }, [isOpen, projectId]);

  const filteredNodes = nodes.filter(node => 
    node.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCanvas = () => {
    router.push(`/canvas?project=${projectId}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xl"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto relative w-full max-w-4xl rounded-2xl border border-[#5B98D6]/20 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-[#4863B0]/10 max-h-[80vh] flex flex-col"
            >
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute right-6 top-6 text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#5B98D6]/20 bg-[#5B98D6]/10">
                    <Grid3x3 className="h-6 w-6 text-[#4863B0]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-serif text-3xl tracking-tight text-[#1a1a1a]">
                      {projectName}
                    </h2>
                    <p className="mt-1 text-sm text-[#1a1a1a]/60">
                      Browse all {nodes.length} pages from the sitemap
                    </p>
                  </div>
                  <Button
                    onClick={handleViewCanvas}
                    className="bg-[#4863B0] text-white hover:bg-[#5B98D6]"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Diagram
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/40" />
                  <Input
                    type="text"
                    placeholder="Search pages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-[#5B98D6]/20 bg-white pl-10 text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#4863B0] focus:ring-[#4863B0]/20"
                  />
                </div>
              </div>

              {/* Nodes list */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-[#5B98D6]/10 bg-white">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <p className="text-[#1a1a1a]/40">Loading pages...</p>
                  </div>
                ) : filteredNodes.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <p className="text-[#1a1a1a]/40">No pages found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#5B98D6]/10">
                    {filteredNodes.map((node, index) => (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="group flex items-center justify-between p-4 hover:bg-[#5B98D6]/5 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm text-[#1a1a1a]">
                            {node.title || 'Untitled'}
                          </p>
                          <p className="truncate text-xs text-[#1a1a1a]/50">
                            {node.url}
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open(node.url, '_blank')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a]/40 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between text-xs text-[#1a1a1a]/50">
                <p>
                  {filteredNodes.length === nodes.length
                    ? `${nodes.length} total pages`
                    : `${filteredNodes.length} of ${nodes.length} pages`}
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

