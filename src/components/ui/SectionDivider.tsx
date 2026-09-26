import React from "react";
import { cn } from "@/utils/cn";

export interface SectionDividerProps {
  label: string;
  className?: string;
  lineClassName?: string;
  textClassName?: string;
}

/**
 * Airlearn signature section divider:
 * Displays a hairline rule with a small, tracked-out uppercase label in the center.
 * Example: ──── IDENTIFY THE ANSWER ────
 */
export const SectionDivider: React.FC<SectionDividerProps> = ({
  label,
  className,
  lineClassName,
  textClassName,
}) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center my-5 w-full select-none",
        className,
      )}
      role="separator"
      aria-label={label}
    >
      <div className="absolute inset-0 flex items-center">
        <div
          className={cn("w-full border-t border-slate-200", lineClassName)}
        />
      </div>
      <span
        className={cn(
          "relative bg-white px-3.5 text-[11px] sm:text-xs font-black tracking-widest text-slate-400 uppercase",
          textClassName,
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default SectionDivider;
