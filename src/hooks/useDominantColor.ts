import { useState, useEffect } from 'react';

/**
 * Extract dominant color from an image
 * Returns a hex color string
 */
export function useDominantColor(imageUrl: string | null): string | null {
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setDominantColor(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setDominantColor(null);
          return;
        }

        // Set canvas size (smaller for performance)
        canvas.width = 50;
        canvas.height = 50;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data - this might fail due to CORS
        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (corsError) {
          // CORS error - can't read pixel data
          // Fallback: use a default color based on image URL hash
          try {
            const urlString = imageUrl;
            const hash = urlString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hue = hash % 360;
            const fallbackColor = `hsl(${hue}, 60%, 50%)`;
            setDominantColor(fallbackColor);
          } catch {
            setDominantColor(null);
          }
          return;
        }
        
        const data = imageData.data;
        
        // Calculate average color
        let r = 0, g = 0, b = 0, count = 0;
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        // Convert to hex
        const hex = `#${[r, g, b].map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('')}`;
        
        setDominantColor(hex);
      } catch (error) {
        console.error('Error extracting dominant color:', error);
        setDominantColor(null);
      }
    };

    img.onerror = () => {
      setDominantColor(null);
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return dominantColor;
}

