import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated = true,
  interactive = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border-2 border-[#E5E5E5] p-5 transition-all',
        elevated && 'border-b-4 border-b-[#CECECE]',
        interactive && 'hover:border-[#1CB0F6] cursor-pointer hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

