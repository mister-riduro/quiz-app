import React from "react";
import { cn } from "@/utils/cn";

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
        // Rounded 16px with clean flat 2px border
        "bg-white rounded-[16px] border-2 border-slate-200 p-6 transition-all",
        elevated && "shadow-xs",
        // Interactive hover state: clean crisp green border
        interactive &&
          "hover:border-duo-green cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
