'use client';

import { cn } from '@/lib/utils';

interface AtlasLogoProps {
  variant?: 'default' | 'compact' | 'with-subtitle';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  subtitle?: string;
}

export function AtlasLogo({ 
  variant = 'default', 
  size = 'md', 
  className,
  subtitle 
}: AtlasLogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Simple Globe Icon */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn('text-[#4863B0]', iconSizes[size])}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 12h20" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
      </svg>

      {/* Text Content */}
      <div className="flex flex-col">
        <span className={cn(
          'font-medium font-serif tracking-tight text-[#1a1a1a] dark:text-gray-50',
          sizeClasses[size]
        )}>
          Atlas
        </span>
        {variant === 'with-subtitle' && subtitle && (
          <span className="text-xs text-[#1a1a1a]/60 dark:text-gray-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
