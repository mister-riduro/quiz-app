import React from "react";
import { cn } from "@/utils/cn";

export interface BottomActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  fixed?: boolean;
  bordered?: boolean;
  containerClassName?: string;
}

/**
 * Universal bottom action bar for primary CTA interactions (check answer, continue, submit).
 * Aligns with Airlearn's clean, distraction-free bottom layout.
 */
export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  children,
  fixed = false,
  bordered = true,
  className,
  containerClassName,
  ...props
}) => {
  return (
    <div
      className={cn(
        "w-full bg-white/95 backdrop-blur-md transition-all duration-200",
        bordered && "border-t-2 border-slate-100",
        fixed && "fixed bottom-0 left-0 right-0 z-40 shadow-lg",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "max-w-3xl mx-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 sm:gap-4",
          containerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default BottomActionBar;
