import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Check, X } from "lucide-react";

export type OptionTileState =
  | "idle"
  | "selected"
  | "correct"
  | "wrong"
  | "disabled";

export interface OptionTileProps {
  label: React.ReactNode;
  prefix?: React.ReactNode;
  state?: OptionTileState;
  size?: "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  rightElement?: React.ReactNode;
}

const stateStyles: Record<
  OptionTileState,
  { container: string; prefix: string }
> = {
  idle: {
    container:
      "bg-white text-slate-800 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs",
    prefix: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  selected: {
    container:
      "bg-emerald-50/40 text-duo-green-border border-2 border-duo-green shadow-xs",
    prefix: "bg-duo-green text-white border-0 shadow-2xs",
  },
  correct: {
    container:
      "bg-emerald-50 text-slate-900 border-2 border-duo-green shadow-xs",
    prefix: "bg-duo-green text-white border-0 shadow-2xs",
  },
  wrong: {
    container: "bg-rose-50 text-slate-900 border-2 border-duo-red shadow-xs",
    prefix: "bg-duo-red text-white border-0 shadow-2xs",
  },
  disabled: {
    container:
      "bg-slate-50/70 text-slate-400 border-2 border-slate-200/80 cursor-not-allowed opacity-60 shadow-none",
    prefix: "bg-slate-100 text-slate-400 border border-slate-200",
  },
};

const sizeStyles = {
  md: {
    container: "p-4 sm:p-4.5 rounded-[13px] min-h-[58px] gap-3.5",
    prefix: "w-8 h-8 text-xs rounded-[10px] font-black",
    text: "text-sm sm:text-base font-bold",
  },
  lg: {
    container: "p-5 sm:p-6 rounded-[13px] min-h-[70px] gap-4",
    prefix: "w-9 h-9 text-sm rounded-[10px] font-black",
    text: "text-base sm:text-lg font-bold",
  },
};

/**
 * Universal quiz option tile component inspired by Airlearn's tactile soft-minimalism.
 * Standardizes option card radii (14px) and letter badges (8px) across question plugins.
 */
export const OptionTile: React.FC<OptionTileProps> = ({
  label,
  prefix,
  state = "idle",
  size = "md",
  fullWidth = true,
  disabled = false,
  onClick,
  className,
  ariaLabel,
  rightElement,
}) => {
  const isDisabled = disabled || state === "disabled";
  const styles = stateStyles[state];
  const sizeConfig = sizeStyles[size];

  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      aria-label={ariaLabel}
      whileHover={!isDisabled && state === "idle" ? { scale: 1.01 } : undefined}
      whileTap={!isDisabled ? { scale: 0.99 } : undefined}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      className={cn(
        "group relative flex items-center justify-between text-left select-none transition-all duration-150",
        fullWidth && "w-full",
        sizeConfig.container,
        styles.container,
        !isDisabled && "cursor-pointer active:translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {prefix !== undefined && (
          <div
            className={cn(
              "shrink-0 inline-flex items-center justify-center transition-colors",
              sizeConfig.prefix,
              styles.prefix,
            )}
          >
            {prefix}
          </div>
        )}

        <div className={cn("min-w-0 flex-1 leading-snug", sizeConfig.text)}>
          {label}
        </div>
      </div>

      {rightElement ? (
        <div className="shrink-0 ml-2">{rightElement}</div>
      ) : (
        <>
          {state === "correct" && (
            <div className="shrink-0 w-6 h-6 rounded-full bg-duo-green text-white flex items-center justify-center ml-2 shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
            </div>
          )}
          {state === "wrong" && (
            <div className="shrink-0 w-6 h-6 rounded-full bg-duo-red text-white flex items-center justify-center ml-2 shadow-xs">
              <X className="w-3.5 h-3.5 stroke-[3.5]" />
            </div>
          )}
        </>
      )}
    </motion.button>
  );
};

export default OptionTile;
