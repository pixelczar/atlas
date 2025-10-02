'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Loader2, X, CheckCircle2, FileText, ChevronDown, Check } from 'lucide-react';
import Image from 'next/image';

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
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [selectedPreviewSitemap, setSelectedPreviewSitemap] = useState<string>('All Sitemaps');
  const [isSitemapPickerOpen, setIsSitemapPickerOpen] = useState(false);

  // Initialize sitemap picker when sitemap data loads
  useEffect(() => {
    if (sitemapData && sitemapData.sitemaps) {
      const sitemaps = sitemapData.sitemaps;
      if (sitemaps.length === 1) {
        setSelectedPreviewSitemap(sitemaps[0]);
      } else {
        setSelectedPreviewSitemap('All Sitemaps');
      }
    }
  }, [sitemapData]);

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

      // Fetch favicon
      const faviconUrls = [
        `https://${data.domain}/favicon.ico`,
        `https://${data.domain}/favicon.png`,
        `https://www.google.com/s2/favicons?domain=${data.domain}&sz=64`,
      ];

      // Try to load favicon
      for (const url of faviconUrls) {
        try {
          const img = new window.Image();
          img.onload = () => setFaviconUrl(url);
          img.src = url;
          break; // Use first one that loads
        } catch {
          continue;
        }
      }
      // Fallback to Google's favicon service
      setFaviconUrl(`https://www.google.com/s2/favicons?domain=${data.domain}&sz=64`);
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
          urlCount: sitemapData.urlCount || sitemapData.totalUrls, // Pass the full count
          sitemaps: sitemapData.sitemaps, // Pass the sitemap sources
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
    setFaviconUrl(null);
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
              className={`pointer-events-auto relative w-full rounded-2xl border border-[#5B98D6]/20 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-[#4863B0]/10 transition-all duration-300 ${
                step === 'preview' ? 'max-w-4xl' : 'max-w-xl'
              }`}
            >
              {/* Close button */}
              <motion.button
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
                >
                  <h2 className="font-serif text-4xl tracking-tight text-[#1a1a1a]">
                    New Project
                  </h2>
                  <p className="mt-1 text-sm text-[#1a1a1a]/60">
                    Enter a domain to visualize its sitemap
                  </p>
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
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        className="border-[#5B98D6]/20 bg-transparent text-[#1a1a1a]/70 hover:bg-[#5B98D6]/10 hover:text-[#1a1a1a]"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleFetchSitemap}
                        disabled={!domain || isLoading}
                        className="bg-[#4863B0] text-white hover:bg-[#5B98D6] disabled:opacity-50"
                      >
                        Fetch Sitemap
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Fetching */}
                {step === 'fetching' && (
                  <motion.div
                    key="fetching"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    {/* Compact loader without background */}
                    <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
                      {/* Pulsing circle - outer ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-[#5B98D6]/50"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.4, 0.6, 0.4],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />

                      {/* Rotating ring - middle */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 0.6,
                          rotate: 360,
                        }}
                        transition={{
                          opacity: { duration: 0.3 },
                          rotate: {
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                      >
                        <svg
                          viewBox="0 0 100 100"
                          className="h-20 w-20"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#5B98D6"
                            strokeWidth="1"
                            strokeDasharray="6 3"
                            opacity="0.7"
                          />
                        </svg>
                      </motion.div>

                      {/* Main graphic - center */}
                      <motion.div
                        className="relative z-10"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                        }}
                        transition={{
                          duration: 0.4,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <Image
                          src="/atlas-graphic-3.svg"
                          alt="Loading"
                          width={60}
                          height={60}
                          priority
                        />
                      </motion.div>
                    </div>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center text-[#1a1a1a]"
                    >
                      Fetching sitemap from <span className="font-medium">{domain}</span>
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-2 text-center text-sm text-[#1a1a1a]/50"
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
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {/* Left Column - Site Info & Stats */}
                    <div className="space-y-6">
                      {/* Site Info Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-xl border border-[#5B98D6]/20 bg-gradient-to-br from-[#5B98D6]/5 to-transparent p-5"
                      >
                        <div className="flex items-start gap-4">
                          {/* Favicon */}
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-[#5B98D6]/20 bg-white overflow-hidden">
                            {faviconUrl ? (
                              <img 
                                src={faviconUrl} 
                                alt={sitemapData.domain}
                                className="h-8 w-8 object-contain"
                                onError={() => setFaviconUrl(null)}
                              />
                            ) : (
                              <Globe className="h-6 w-6 text-[#4863B0]/50" />
                            )}
                          </div>

                          {/* Site Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[#1a1a1a] truncate">
                              {sitemapData.domain}
                            </h3>
                            <p className="mt-1 text-xs text-[#1a1a1a]/60 truncate">
                              {sitemapData.sitemapUrl}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Sitemap Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border border-[#5B98D6]/20 bg-gradient-to-br from-[#5B98D6]/5 to-transparent p-5"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-[#1a1a1a]">Sitemap Found</span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15, type: 'spring' }}
                            className="rounded-lg bg-white/50 border border-[#5B98D6]/10 px-3 py-2"
                          >
                            <div className="text-xs text-[#1a1a1a]/60 mb-1">URLs Found</div>
                            <div className="text-lg font-semibold text-[#4863B0]">
                              {sitemapData.urlCount}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="rounded-lg bg-white/50 border border-[#5B98D6]/10 px-3 py-2"
                          >
                            <div className="text-xs text-[#1a1a1a]/60 mb-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Sitemaps
                            </div>
                            <div className="text-lg font-semibold text-[#4863B0]">
                              {sitemapData.sitemaps?.length || 1}
                            </div>
                          </motion.div>
                        </div>

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
                    </div>

                    {/* Right Column - Preview with Sitemap Picker */}
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="mb-3 text-sm font-medium text-[#1a1a1a]">
                          Preview <span className="text-[#1a1a1a]/40">(first 10 URLs)</span>
                        </p>
                        
                        {/* Sitemap Picker */}
                        <div className="relative mb-3">
                          <motion.button
                            onClick={() => setIsSitemapPickerOpen(!isSitemapPickerOpen)}
                            className="flex w-full items-center justify-between rounded-lg border border-[#5B98D6]/20 bg-white px-3 py-2 text-sm text-[#1a1a1a] transition-colors hover:border-[#4863B0]/40"
                          >
                            <span className="truncate">{selectedPreviewSitemap}</span>
                            <ChevronDown className={`h-4 w-4 text-[#1a1a1a]/60 transition-transform ${isSitemapPickerOpen ? 'rotate-180' : ''}`} />
                          </motion.button>

                          <AnimatePresence>
                            {isSitemapPickerOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setIsSitemapPickerOpen(false)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-[#5B98D6]/20 bg-white shadow-xl"
                                >
                                  <div className="p-2">
                                    {['All Sitemaps', ...(sitemapData.sitemaps || [])].map((sitemap, index) => {
                                      // Calculate URL count for this sitemap
                                      let urlCount = 0;
                                      if (sitemap === 'All Sitemaps') {
                                        urlCount = sitemapData.urlCount || 0;
                                      } else {
                                        // Count URLs from this specific sitemap
                                        urlCount = sitemapData.urls?.filter((url: any) => 
                                          url.sitemapSource === sitemap
                                        ).length || 0;
                                      }
                                      
                                      return (
                                        <motion.button
                                          key={sitemap}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.05 }}
                                          onClick={() => {
                                            setSelectedPreviewSitemap(sitemap);
                                            setIsSitemapPickerOpen(false);
                                          }}
                                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                                            selectedPreviewSitemap === sitemap
                                              ? 'bg-[#5B98D6]/10 text-[#4863B0] font-medium'
                                              : 'text-[#1a1a1a] hover:bg-[#5B98D6]/5'
                                          }`}
                                        >
                                          <span className="truncate">{sitemap}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-[#1a1a1a]/50">
                                              {urlCount}
                                            </span>
                                            {selectedPreviewSitemap === sitemap && (
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

                        {/* URL List */}
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
                    </div>

                    {/* Action Buttons - Full Width */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="lg:col-span-2 flex justify-end gap-3 pt-2"
                    >
                      <Button
                        variant="outline"
                        onClick={() => setStep('input')}
                        className="border-[#5B98D6]/20 bg-transparent text-[#1a1a1a]/70 hover:bg-[#5B98D6]/10 hover:text-[#1a1a1a]"
                      >
                        Back
                      </Button>
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
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

