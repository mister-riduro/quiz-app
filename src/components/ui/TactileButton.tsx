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
  green: "bg-duo-green border-duo-green-border text-white hover:brightness-105",
  blue: "bg-duo-blue border-duo-blue-border text-white hover:brightness-105",
  orange:
    "bg-duo-orange border-duo-orange-border text-white hover:brightness-105",
  red: "bg-duo-red border-duo-red-border text-white hover:brightness-105",
  yellow:
    "bg-duo-yellow border-duo-yellow-border text-duo-dark hover:brightness-105",
  gray: "bg-duo-gray border-duo-gray-border text-duo-dark/50 hover:brightness-100",
  outline:
    "bg-white border-duo-gray border-b-duo-gray-border border-r-duo-gray-border text-duo-dark hover:bg-slate-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl font-bold gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-2xl font-extrabold gap-2",
  lg: "px-7 py-3.5 text-base tracking-wide rounded-2xl font-black gap-2.5",
  icon: "p-3 text-sm rounded-2xl aspect-square justify-center",
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
          // Base & Typography
          "relative inline-flex items-center justify-center select-none uppercase tracking-wider transition-all duration-75",
          // 3D Bevel Structure (PRD 3.3 & prompt specs)
          "border-b-4 border-r-2 border-solid",
          // Active Physical Interaction
          "active:translate-y-[2px] active:border-b-2",
          // Size & Variant
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          // Disabled State: Abu-abu redup, tanpa efek active press
          isDisabled &&
            "bg-duo-gray border-duo-gray-border text-duo-dark/40 cursor-not-allowed transform-none active:translate-y-0 active:border-b-4 hover:brightness-100 opacity-80",
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
