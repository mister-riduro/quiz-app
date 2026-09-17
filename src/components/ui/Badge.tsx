import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'blue' | 'orange' | 'red' | 'yellow' | 'gray';
}

const badgeVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  green: 'bg-[#D7FFB8] text-[#46A302] border-[#46A302]',
  blue: 'bg-[#DDF4FF] text-[#1899D6] border-[#1899D6]',
  orange: 'bg-[#FFE8CC] text-[#D97F00] border-[#D97F00]',
  red: 'bg-[#FFDFE0] text-[#EA2B2B] border-[#EA2B2B]',
  yellow: 'bg-[#FFF5CC] text-[#D4A500] border-[#D4A500]',
  gray: 'bg-[#E5E5E5] text-[#4B4B4B] border-[#CECECE]',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'blue',
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

