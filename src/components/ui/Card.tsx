import React from "react";
import { cn } from "@/lib/utils";

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
        "bg-white rounded-[16px] border-2 border-slate-200 p-5 transition-all",
        elevated && "shadow-xs",
        interactive &&
          "hover:border-duo-green cursor-pointer hover:shadow-sm transition-all hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
