'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface AddNodeInputProps {
  onAddNode: (url: string) => Promise<void>;
  isLoading?: boolean;
}

export function AddNodeInput({ onAddNode, isLoading = false }: AddNodeInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      // Try adding https:// if no protocol
      try {
        new URL(`https://${input}`);
        return true;
      } catch {
        return false;
      }
    }
  };

  const normalizeUrl = (input: string): string => {
    try {
      return new URL(input).href;
    } catch {
      return new URL(`https://${input}`).href;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    const normalizedUrl = normalizeUrl(url);
    
    try {
      await onAddNode(normalizedUrl);
      setUrl('');
    } catch (err) {
      setError('Failed to add node');
      console.error('Error adding node:', err);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <div className="relative flex-1">
          <Input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="Enter page URL to add..."
            className="border-[#5B98D6]/30 bg-white pr-10 text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus-visible:border-[#4863B0] focus-visible:ring-[#4863B0]/20"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3 w-3 animate-spin text-[#4863B0]" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="gap-2 bg-[#4863B0] text-white hover:bg-[#5B98D6]"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </form>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-1 text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
