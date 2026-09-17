import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'blue' | 'orange' | 'red' | 'yellow' | 'gray' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  green: 'bg-[#58CC02] border-[#46A302] text-white',
  blue: 'bg-[#1CB0F6] border-[#1899D6] text-white',
  orange: 'bg-[#FF9600] border-[#D97F00] text-white',
  red: 'bg-[#FF4B4B] border-[#EA2B2B] text-white',
  yellow: 'bg-[#FFC800] border-[#D4A500] text-[#4B4B4B]',
  gray: 'bg-[#E5E5E5] border-[#CECECE] text-[#4B4B4B]',
  outline: 'bg-white border-[#E5E5E5] text-[#4B4B4B] hover:bg-[#F7F9FA]',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-2xl',
  lg: 'px-7 py-3.5 text-base tracking-wide rounded-2xl',
  xl: 'px-8 py-4 text-lg font-black tracking-wider rounded-3xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'green',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={cn(
        'btn-3d-press font-extrabold uppercase transition-all duration-75',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

