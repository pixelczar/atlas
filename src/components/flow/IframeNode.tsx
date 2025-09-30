'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { ExternalLink, Maximize2, Minimize2, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface IframeNodeData {
  label: string;
  url: string;
  thumbnailUrl?: string;
  isLoading?: boolean;
  status?: 'pending' | 'ready';
  isHidden?: boolean;
  onDelete?: (nodeId: string) => void;
}

function IframeNode({ data, id }: NodeProps<IframeNodeData>) {
  const [showIframe, setShowIframe] = useState(false);
  const isHidden = data.isHidden;

  return (
    <div className={`group relative rounded-xl border border-[#5B98D6]/30 bg-white shadow-sm transition-all hover:shadow-md hover:border-[#4863B0] ${isHidden ? 'opacity-30' : 'opacity-100'}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#4863B0]"
      />

      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5B98D6]/20 bg-[#5B98D6]/5 px-2 py-1.5 rounded-t-xl">
          <div className="flex-1 truncate pr-2">
            <p className="truncate text-xs font-medium text-[#1a1a1a]">
              {data.label}
            </p>
            <p className="truncate text-[10px] text-[#1a1a1a]/50">
              {data.url}
            </p>
          </div>
          <div className="flex gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setShowIframe(!showIframe)}
              title={showIframe ? 'Show thumbnail' : 'Show live preview'}
            >
              {showIframe ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => window.open(data.url, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            {data.onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => data.onDelete?.(id)}
                title="Delete node"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative h-36 w-72 overflow-hidden bg-[#DDEEF9] rounded-b-xl">
          {data.status === 'pending' || data.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin text-[#4863B0]" />
                <p className="text-[10px] text-[#1a1a1a]/50">
                  {data.status === 'pending' ? 'Generating screenshot...' : 'Loading preview...'}
                </p>
              </div>
            </div>
          ) : showIframe ? (
            <iframe
              src={data.url}
              className="h-full w-full border-0"
              title={data.label}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : data.thumbnailUrl ? (
            <img
              src={data.thumbnailUrl}
              alt={data.label}
              className="h-full w-full object-cover rounded-b-xl"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-1 text-[#1a1a1a]/40">
                <div className="h-8 w-8 rounded border border-[#5B98D6]/20 bg-white flex items-center justify-center">
                  <ExternalLink className="h-4 w-4" />
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
        className="!bg-[#4863B0]"
      />
    </div>
  );
}

export default memo(IframeNode);
