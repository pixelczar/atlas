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
      // Check cache first
      if (domainIconCache.has(domainKey)) {
        return domainIconCache.get(domainKey)!;
      }

      // Check if already fetching
      if (pendingRequests.has(domainKey)) {
        return pendingRequests.get(domainKey)!;
      }

      // Create the fetch promise
      const fetchPromise = (async () => {
        try {
          // Try to get OG image for the root domain only
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
          console.log(`OG image fetch failed for ${domainKey}, using fallback`);
        }

        // Fallback to simple favicon services - request higher resolution
        const fallbackSources = [
          `https://logo.clearbit.com/${domainKey}?size=256`,
          `https://logo.clearbit.com/${domainKey}?size=128`,
          `https://www.google.com/s2/favicons?domain=${domainKey}&sz=256`,
          `https://www.google.com/s2/favicons?domain=${domainKey}&sz=128`,
          `https://www.google.com/s2/favicons?domain=${domainKey}&sz=64`,
        ];

        for (const source of fallbackSources) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = () => resolve(source);
              img.onerror = () => reject(new Error('Failed to load'));
              img.src = source;
            });
            
            domainIconCache.set(domainKey, source);
            return source;
          } catch (err) {
            continue;
          }
        }

        // Final fallback - SVG with higher resolution
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
          setIconUrl(icon);
          setIsLoading(false);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setError(true);
          setIsLoading(false);
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

  return { iconUrl, isLoading, error };
}
