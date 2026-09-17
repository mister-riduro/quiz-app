import React from 'react';
import { cn } from '@/utils/cn';

export interface DuoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export const DuoCard: React.FC<DuoCardProps> = ({
  elevated = true,
  interactive = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        // Rounded-3xl with solid 2px border as per specification
        'bg-white rounded-3xl border-2 border-slate-200 p-6 transition-all',
        // Optional 3D tactile bottom bevel
        elevated && 'border-b-4 border-b-slate-300 shadow-sm',
        // Interactive hover state
        interactive &&
          'hover:border-duo-blue hover:border-b-duo-blue-border cursor-pointer transition-transform hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

