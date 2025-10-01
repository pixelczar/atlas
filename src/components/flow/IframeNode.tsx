'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2 } from 'lucide-react';

export interface IframeNodeData {
  label: string;
  url: string;
  thumbnailUrl?: string;
  isLoading?: boolean;
  status?: 'pending' | 'ready';
  isHidden?: boolean;
  onDelete?: (nodeId: string) => void;
}

function IframeNode({ data, id, selected }: NodeProps<IframeNodeData>) {
  const [showIframe, setShowIframe] = useState(false);
  const isHidden = data.isHidden;

  // Extract page title from URL path
  const getPageTitle = (url: string, label?: string) => {
    // If label exists and is not "Untitled", use it
    if (label && label !== 'Untitled') {
      return label;
    }

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // If it's the homepage
      if (pathname === '/' || pathname === '') {
        return 'Home';
      }
      
      // Get the last segment of the path
      const segments = pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      if (lastSegment) {
        // Convert slug to title case (e.g., "about-us" -> "About Us")
        return lastSegment
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      return 'Page';
    } catch {
      return label || 'Page';
    }
  };

  // Extract domain from URL for cleaner display
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isHidden ? 0.3 : 1,
        scale: selected ? 1.02 : 1,
      }}
      transition={{ 
        opacity: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.2 },
      }}
      className={`group relative rounded-xl border-2 bg-white shadow-lg transition-all ${
        selected 
          ? 'border-[#4863B0] shadow-[#4863B0]/20 ring-2 ring-[#4863B0]/20' 
          : 'border-[#5B98D6]/20 hover:border-[#5B98D6]/40'
      }`}
      style={{ width: 288 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#4863B0]"
      />

      <div className="flex flex-col overflow-hidden rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5B98D6]/10 bg-gradient-to-br from-[#5B98D6]/5 to-transparent px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[#1a1a1a]">
              {getPageTitle(data.url, data.label)}
            </p>
            <p className="truncate text-[10px] text-[#1a1a1a]/40" title={data.url}>
              {data.url}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#DDEEF9] to-[#DDEEF9]/80">
          {data.status === 'pending' || data.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="h-5 w-5 text-[#4863B0]" />
                </motion.div>
                <p className="text-[10px] text-[#1a1a1a]/50">
                  {data.status === 'pending' ? 'Generating screenshot...' : 'Loading...'}
                </p>
              </motion.div>
            </div>
          ) : showIframe ? (
            <iframe
              src={data.url}
              className="h-full w-full border-0"
              title={data.label}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : data.thumbnailUrl ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={data.thumbnailUrl}
              alt={data.label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-[#1a1a1a]/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#5B98D6]/20 bg-white">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <p className="text-[10px]">No preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#4863B0]"
      />
    </motion.div>
  );
}

export default memo(IframeNode);
