import { useState, useEffect, useRef } from 'react';

interface IconSource {
  url: string;
  priority: number;
  type: 'favicon' | 'apple-touch' | 'og-image' | 'clearbit' | 'google';
}

// Global cache for domain icons
const domainIconCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

export function useHighResIcon(domain: string, url?: string) {
  const [iconUrl, setIconUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRealIcon, setIsRealIcon] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!domain) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchIconForDomain = async (domainKey: string): Promise<string> => {
      // Check cache first (but skip if it's the SVG fallback - retry to get real favicon)
      const cached = domainIconCache.get(domainKey);
      if (cached && !cached.startsWith('data:image/svg')) {
        // Verify cached icon still works
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
            img.onload = () => {
              clearTimeout(timeout);
              resolve(cached);
            };
            img.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Cached icon failed'));
            };
            img.src = cached;
          });
          return cached;
        } catch {
          // Cached icon failed, clear it and try again
          domainIconCache.delete(domainKey);
        }
      }
      // If cached is SVG fallback, clear it and try again
      if (cached && cached.startsWith('data:image/svg')) {
        domainIconCache.delete(domainKey);
      }

      // Check if already fetching
      if (pendingRequests.has(domainKey)) {
        return pendingRequests.get(domainKey)!;
      }

      // Create the fetch promise
      const fetchPromise = (async () => {
        // PRIMARY: Use Google favicon service (same as breadcrumb - we know this works!)
        const googleFaviconSources = [
          `https://www.google.com/s2/favicons?domain=${domainKey}&sz=256`,
          `https://www.google.com/s2/favicons?domain=${domainKey}&sz=128`,
          `https://www.google.com/s2/favicons?domain=${domainKey}&sz=64`,
        ];

        for (const source of googleFaviconSources) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve(source);
              };
              img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load'));
              };
              img.src = source;
            });
            
            domainIconCache.set(domainKey, source);
            return source;
          } catch (err) {
            continue;
          }
        }

        // SECONDARY: Try Clearbit logos
        const clearbitSources = [
          `https://logo.clearbit.com/${domainKey}?size=256`,
          `https://logo.clearbit.com/${domainKey}?size=128`,
        ];

        for (const source of clearbitSources) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve(source);
              };
              img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load'));
              };
              img.src = source;
            });
            
            domainIconCache.set(domainKey, source);
            return source;
          } catch (err) {
            continue;
          }
        }

        // TERTIARY: Try OG image for the root domain only
        try {
          const rootUrl = `https://${domainKey}`;
          const ogResponse = await fetch(`/api/og-image?url=${encodeURIComponent(rootUrl)}`, {
            signal: abortController.signal,
          });
          
          if (ogResponse.ok) {
            const ogData = await ogResponse.json();
            if (ogData.success && ogData.imageUrl) {
              domainIconCache.set(domainKey, ogData.imageUrl);
              return ogData.imageUrl;
            }
          }
        } catch (error) {
        }

        // Final fallback - SVG with higher resolution (but mark as not real)
        const svgFallback = `data:image/svg+xml;base64,${btoa(`
          <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <rect width="256" height="256" fill="#4863B0"/>
            <text x="128" y="150" font-family="Arial, sans-serif" font-size="96" font-weight="bold" text-anchor="middle" fill="white">${domainKey.charAt(0).toUpperCase()}</text>
          </svg>
        `)}`;
        
        domainIconCache.set(domainKey, svgFallback);
        return svgFallback;
      })();

      pendingRequests.set(domainKey, fetchPromise);
      return fetchPromise;
    };

    const loadIcon = async () => {
      if (abortController.signal.aborted) return;

      setIsLoading(true);
      setError(false);

      try {
        const icon = await fetchIconForDomain(domain);
        if (!abortController.signal.aborted) {
          const isReal = !icon.startsWith('data:image/svg');
          setIconUrl(icon);
          setIsRealIcon(isReal);
          setIsLoading(false);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error(`❌ Failed to load icon for ${domain}:`, error);
          setError(true);
          setIsLoading(false);
          setIsRealIcon(false);
        }
      }
    };

    loadIcon();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [domain]);

  return { iconUrl, isLoading, error, isRealIcon };
}
