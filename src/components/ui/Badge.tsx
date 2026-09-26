import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "green" | "blue" | "orange" | "red" | "yellow" | "gray";
}

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  green: "bg-[#D7FFB8] text-[#46A302] border-0",
  blue: "bg-[#DDF4FF] text-[#1899D6] border-0",
  orange: "bg-[#FFE8CC] text-[#D97F00] border-0",
  red: "bg-[#FFDFE0] text-[#EA2B2B] border-0",
  yellow: "bg-[#FFF5CC] text-[#D4A500] border-0",
  gray: "bg-[#E5E5E5] text-[#4B4B4B] border-0",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "blue",
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[10px] text-xs font-bold uppercase tracking-wider border-0 shadow-2xs",
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
