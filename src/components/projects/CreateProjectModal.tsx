'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Loader2, X, CheckCircle2 } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [domain, setDomain] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'fetching' | 'preview'>('input');
  const [sitemapData, setSitemapData] = useState<any>(null);

  const handleFetchSitemap = async () => {
    if (!domain) {
      setError('Please enter a domain');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('fetching');

    try {
      const response = await fetch('/api/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sitemap');
      }

      setSitemapData(data);
      setStep('preview');

      // Auto-generate project name from domain if not set
      if (!projectName) {
        setProjectName(data.domain);
      }
    } catch (err) {
      setError((err as Error).message);
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!sitemapData) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Create project in Firestore with sitemap data
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName || sitemapData.domain,
          domain: sitemapData.domain,
          sitemapUrl: sitemapData.sitemapUrl,
          urls: sitemapData.urls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      onProjectCreated(data.projectId);
      handleClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDomain('');
    setProjectName('');
    setError(null);
    setStep('input');
    setSitemapData(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xl"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto relative w-full max-w-xl rounded-2xl border border-[#5B98D6]/20 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-[#4863B0]/10"
            >
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="absolute right-6 top-6 text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>

              {/* Header */}
              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#5B98D6]/20 bg-[#5B98D6]/10">
                    <Globe className="h-6 w-6 text-[#4863B0]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl tracking-tight text-[#1a1a1a]">
                      New Project
                    </h2>
                    <p className="mt-1 text-sm text-[#1a1a1a]/60">
                      Enter a domain to visualize its sitemap
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Error message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden rounded-lg border border-red-400/20 bg-red-50 p-4"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 1: Input */}
              <AnimatePresence mode="wait">
                {step === 'input' && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#1a1a1a]">
                        Domain
                      </label>
                      <Input
                        type="text"
                        placeholder="example.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="border-[#5B98D6]/20 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#4863B0] focus:ring-[#4863B0]/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFetchSitemap();
                        }}
                        autoFocus
                      />
                      <p className="mt-2 text-xs text-[#1a1a1a]/50">
                        We'll automatically check for sitemap.xml
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#1a1a1a]">
                        Project Name <span className="text-[#1a1a1a]/40">(optional)</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Leave blank to use domain name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="border-[#5B98D6]/20 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#4863B0] focus:ring-[#4863B0]/20"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          onClick={handleClose}
                          className="border-[#5B98D6]/20 bg-transparent text-[#1a1a1a]/70 hover:bg-[#5B98D6]/10 hover:text-[#1a1a1a]"
                        >
                          Cancel
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleFetchSitemap}
                          disabled={!domain || isLoading}
                          className="bg-[#4863B0] text-white hover:bg-[#5B98D6] disabled:opacity-50"
                        >
                          Fetch Sitemap
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Fetching */}
                {step === 'fetching' && (
                  <motion.div
                    key="fetching"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Globe className="h-12 w-12 text-[#4863B0]" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-6 text-[#1a1a1a]"
                    >
                      Fetching sitemap from <span className="font-medium">{domain}</span>
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-2 text-sm text-[#1a1a1a]/50"
                    >
                      This may take a moment if the sitemap has multiple files
                    </motion.p>
                  </motion.div>
                )}

                {/* Step 3: Preview */}
                {step === 'preview' && sitemapData && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-xl border border-[#5B98D6]/20 bg-gradient-to-br from-[#5B98D6]/5 to-transparent p-5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-[#1a1a1a]">Sitemap Found</span>
                        </div>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring' }}
                          className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                        >
                          {sitemapData.urlCount} URLs
                        </motion.span>
                      </div>
                      <p className="text-sm text-[#1a1a1a]/70">{sitemapData.sitemapUrl}</p>
                      {sitemapData.urlCount > 500 && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 text-xs text-amber-600"
                        >
                          ⚠️ Only the first 500 pages will be added to keep performance optimal
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="mb-2 block text-sm font-medium text-[#1a1a1a]">
                        Project Name
                      </label>
                      <Input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="border-[#5B98D6]/20 bg-white text-[#1a1a1a] focus:border-[#4863B0] focus:ring-[#4863B0]/20"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="mb-3 text-sm font-medium text-[#1a1a1a]">
                        Preview <span className="text-[#1a1a1a]/40">(first 10 URLs)</span>
                      </p>
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[#5B98D6]/10 bg-white p-4">
                        {sitemapData.urls.slice(0, 10).map((item: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            className="truncate text-sm text-[#1a1a1a]/60 hover:text-[#4863B0] transition-colors"
                          >
                            {item.url}
                          </motion.div>
                        ))}
                        {sitemapData.urlCount > 10 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="pt-3 text-xs text-[#1a1a1a]/40"
                          >
                            ... and {sitemapData.urlCount - 10} more
                          </motion.p>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex justify-end gap-3 pt-2"
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          onClick={() => setStep('input')}
                          className="border-[#5B98D6]/20 bg-transparent text-[#1a1a1a]/70 hover:bg-[#5B98D6]/10 hover:text-[#1a1a1a]"
                        >
                          Back
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleCreateProject}
                          disabled={isLoading}
                          className="bg-[#4863B0] text-white hover:bg-[#5B98D6] disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Project'
                          )}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

