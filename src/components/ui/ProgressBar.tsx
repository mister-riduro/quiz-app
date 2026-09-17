import React from 'react';
import { cn } from '@/utils/cn';

export interface ProgressBarProps {
  current: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

const sizeStyles: Record<'sm' | 'md' | 'lg', { track: string; highlight: string }> = {
  sm: {
    track: 'h-3',
    highlight: 'top-0.5 left-2 right-2 h-0.5',
  },
  md: {
    track: 'h-4',
    highlight: 'top-1 left-2.5 right-2.5 h-1',
  },
  lg: {
    track: 'h-6',
    highlight: 'top-1.5 left-3 right-3 h-1.5',
  },
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  size = 'md',
  className,
  ariaLabel = 'Quiz progress',
}) => {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      className={cn(
        // Capsule container with smooth gray track
        'relative w-full bg-duo-gray/80 rounded-full overflow-hidden shadow-inner',
        sizeStyles[size].track,
        className
      )}
    >
      {/* Green Fill with smooth transition */}
      <div
        className="h-full bg-duo-green rounded-full transition-all duration-300 ease-out relative"
        style={{ width: `${percentage}%` }}
      >
        {/* Semi-transparent white highlight bar at the top of the track */}
        {percentage > 3 && (
          <div
            className={cn(
              'absolute bg-white/45 rounded-full pointer-events-none',
              sizeStyles[size].highlight
            )}
          />
        )}
      </div>
    </div>
  );
};
