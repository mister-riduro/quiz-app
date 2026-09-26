import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export type TileTokenState =
  | "idle"
  | "selected"
  | "correct"
  | "wrong"
  | "disabled";
export type TileTokenSize = "sm" | "md" | "lg";

export interface TileTokenProps {
  label: string;
  state?: TileTokenState;
  size?: TileTokenSize;
  subLabel?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

const stateStyles: Record<TileTokenState, string> = {
  idle: "bg-white text-duo-dark border-2 border-slate-200 hover:bg-slate-50",
  selected: "bg-duo-blue text-white border-0 shadow-xs",
  correct: "bg-duo-green text-white border-0 shadow-xs",
  wrong: "bg-duo-red text-white border-0 shadow-xs",
  disabled:
    "bg-duo-gray text-duo-dark/30 border-0 cursor-not-allowed opacity-60 select-none shadow-none",
};

const sizeStyles: Record<
  TileTokenSize,
  { container: string; text: string; sub: string }
> = {
  sm: {
    container: "min-w-[42px] h-[48px] px-2 rounded-[10px]",
    text: "text-lg font-black",
    sub: "text-[10px]",
  },
  md: {
    container: "min-w-[56px] h-[64px] px-3 rounded-[13px]",
    text: "text-2xl font-black",
    sub: "text-xs",
  },
  lg: {
    container: "min-w-[72px] h-[80px] px-4 rounded-[13px]",
    text: "text-3xl font-black",
    sub: "text-xs",
  },
};

export const TileToken: React.FC<TileTokenProps> = ({
  label,
  state = "idle",
  size = "md",
  subLabel,
  onClick,
  className,
  ariaLabel,
}) => {
  const isDisabled = state === "disabled";

  // Micro-animations per state
  const getAnimationVariants = () => {
    switch (state) {
      case "wrong":
        return {
          x: [-6, 6, -5, 5, -2, 2, 0],
          transition: { duration: 0.35, ease: "easeInOut" },
        };
      case "correct":
        return {
          scale: [1, 1.15, 0.96, 1.04, 1],
          transition: {
            duration: 0.4,
            type: "spring",
            stiffness: 450,
            damping: 18,
          },
        };
      case "selected":
        return {
          scale: 1.03,
          transition: { type: "spring", stiffness: 400, damping: 20 },
        };
      default:
        return {
          scale: 1,
          x: 0,
        };
    }
  };

  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      aria-label={ariaLabel || label}
      animate={getAnimationVariants()}
      whileHover={!isDisabled ? { scale: 1.04, translateY: -1 } : undefined}
      whileTap={!isDisabled ? { scale: 0.94, translateY: 2 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={cn(
        // Base styling
        "relative inline-flex flex-col items-center justify-center font-black select-none transition-colors duration-150",
        sizeStyles[size].container,
        stateStyles[state],
        className,
      )}
    >
      <span className={cn("tracking-tight", sizeStyles[size].text)}>
        {label}
      </span>
      {subLabel && (
        <span
          className={cn("font-bold opacity-75 -mt-0.5", sizeStyles[size].sub)}
        >
          {subLabel}
        </span>
      )}
    </motion.button>
  );
};
