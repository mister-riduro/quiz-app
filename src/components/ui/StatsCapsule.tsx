import React from "react";
import { cn } from "@/utils/cn";

export interface StatsCapsuleProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
  variant?: "neutral" | "streak" | "xp" | "lives" | "green";
}

const variantStyles: Record<
  NonNullable<StatsCapsuleProps["variant"]>,
  { container: string; icon: string }
> = {
  neutral: {
    container: "bg-white border-slate-200 text-duo-dark",
    icon: "text-slate-500",
  },
  streak: {
    container: "bg-white border-slate-200 text-duo-dark",
    icon: "text-orange-500",
  },
  xp: {
    container: "bg-white border-slate-200 text-duo-dark",
    icon: "text-emerald-500",
  },
  lives: {
    container: "bg-white border-slate-200 text-duo-dark",
    icon: "text-rose-500",
  },
  green: {
    container: "bg-white border-slate-200 text-duo-dark",
    icon: "text-duo-green",
  },
};

/**
 * Airlearn header stats capsule:
 * Displays a clean white pill with thin border, Lucide icon, and bold count.
 */
export const StatsCapsule: React.FC<StatsCapsuleProps> = ({
  icon,
  value,
  label,
  variant = "neutral",
  className,
  ...props
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 border rounded-full shadow-2xs text-xs font-bold transition-all",
        styles.container,
        className,
      )}
      {...props}
    >
      <span className={cn("shrink-0 inline-flex items-center", styles.icon)}>
        {icon}
      </span>
      <span className="font-black tracking-tight">{value}</span>
      {label && (
        <span className="text-slate-400 text-[11px] font-semibold">
          {label}
        </span>
      )}
    </div>
  );
};

export default StatsCapsule;
