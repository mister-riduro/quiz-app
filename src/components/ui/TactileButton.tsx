import React from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant =
  | "green"
  | "blue"
  | "orange"
  | "red"
  | "yellow"
  | "gray"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  green: "bg-duo-green text-white hover:brightness-105 shadow-xs border-0",
  blue: "bg-duo-blue text-white hover:brightness-105 shadow-xs border-0",
  orange: "bg-duo-orange text-white hover:brightness-105 shadow-xs border-0",
  red: "bg-duo-red text-white hover:brightness-105 shadow-xs border-0",
  yellow: "bg-duo-yellow text-duo-dark hover:brightness-105 shadow-xs border-0",
  gray: "bg-duo-gray text-duo-dark/50 hover:brightness-100 border-0",
  outline:
    "bg-white border-2 border-slate-200 hover:border-slate-300 text-duo-dark hover:bg-slate-50 shadow-2xs",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs rounded-[10px] font-black gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-[13px] font-black gap-2",
  lg: "px-6 py-3.5 text-sm sm:text-base rounded-[13px] font-black gap-2.5",
  icon: "p-2.5 text-sm rounded-[13px] aspect-square justify-center",
};

export const TactileButton = React.forwardRef<
  HTMLButtonElement,
  TactileButtonProps
>(
  (
    {
      variant = "green",
      size = "md",
      icon,
      iconPosition = "left",
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base & Typography (All Uppercase, clean flat button)
          "relative inline-flex items-center justify-center select-none uppercase tracking-wider font-black transition-all duration-75",
          // Active Physical Interaction
          "active:translate-y-0.5 active:scale-[0.99]",
          // Size & Variant
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          // Disabled State
          isDisabled &&
            "bg-duo-gray text-duo-dark/40 border-0 cursor-not-allowed transform-none active:translate-y-0 hover:brightness-100 opacity-80",
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span
            className="inline-flex items-center gap-1.5 py-0.5"
            aria-label="Loading"
          >
            <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" />
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="inline-flex items-center shrink-0">{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === "right" && (
              <span className="inline-flex items-center shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  },
);

TactileButton.displayName = "TactileButton";
