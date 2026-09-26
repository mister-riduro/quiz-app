import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

export interface DuoDropdownOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  iconBgClassName?: string;
  description?: string;
  disabled?: boolean;
}

export type DuoDropdownVariant = "default" | "blue" | "green" | "amber";
export type DuoDropdownSize = "sm" | "md";
export type DuoDropdownPlacement = "auto" | "top" | "bottom";

export interface DuoDropdownProps<T = string | number> {
  value: T;
  onChange: (value: T, option?: DuoDropdownOption<T>) => void;
  options: DuoDropdownOption<T>[];
  placeholder?: string;
  menuHeader?: string;
  variant?: DuoDropdownVariant;
  size?: DuoDropdownSize;
  placement?: DuoDropdownPlacement;
  triggerIcon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disableSound?: boolean;
  "aria-label"?: string;
  id?: string;
}

export function DuoDropdown<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder = "Pilih opsi...",
  menuHeader,
  variant: _variant = "default",
  size = "sm",
  placement = "auto",
  triggerIcon,
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  disableSound = false,
  "aria-label": ariaLabel,
  id,
}: DuoDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [computedPlacement, setComputedPlacement] = useState<"top" | "bottom">(
    "bottom",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { playTap, playPop } = useSoundEffect();
  const generatedId = useId();
  const dropdownId = id || generatedId;

  // Selected option lookup
  const selectedOption = options.find((opt) => opt.value === value);

  // Determine smart placement (auto drops up if near viewport bottom)
  useEffect(() => {
    if (!isOpen) return;

    if (placement === "auto" && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        setComputedPlacement("top");
      } else {
        setComputedPlacement("bottom");
      }
    } else if (placement !== "auto") {
      setComputedPlacement(placement);
    }
  }, [isOpen, placement]);

  // Click outside and ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    if (!disableSound) {
      playTap();
    }
    setIsOpen((prev) => !prev);
  }, [disabled, disableSound, playTap]);

  const handleSelect = (option: DuoDropdownOption<T>) => {
    if (option.disabled) return;
    if (!disableSound) {
      playPop();
    }
    onChange(option.value, option);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        if (!disableSound) playTap();
        setIsOpen(true);
      } else if (menuRef.current) {
        const buttons = menuRef.current.querySelectorAll<HTMLButtonElement>(
          "button:not([disabled])",
        );
        if (buttons.length > 0) {
          buttons[0].focus();
        }
      }
    }
  };

  // Selected item in menu (neutral dark highlight)
  const getSelectedItemClasses = () =>
    "bg-slate-100 text-duo-dark font-semibold";

  // Checkmark color (dark)
  const getCheckmarkColor = () => "text-duo-dark";

  // Icon badge background when selected (stay blue as requested)
  const getSelectedIconBg = () => "bg-duo-blue text-white";

  // Trigger icon background (stay blue as requested)
  const getTriggerIconBg = () => "bg-duo-blue/10 text-duo-blue";

  // Which icon to show on trigger (if any)
  const CurrentIcon = selectedOption?.icon || triggerIcon;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full select-none", className)}
    >
      <button
        ref={triggerRef}
        id={dropdownId}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn(
          "w-full flex items-center justify-between bg-white text-slate-700 font-semibold transition-all cursor-pointer shadow-xs active:translate-y-0.5 outline-none border-2",
          size === "sm"
            ? "px-3 py-2 text-xs sm:text-sm rounded-[10px]"
            : "px-4 py-3 text-sm sm:text-base rounded-[13px]",
          isOpen
            ? "border-duo-dark ring-4 ring-duo-dark/15"
            : "border-slate-200 hover:border-slate-400 focus:border-duo-dark focus:ring-4 focus:ring-duo-dark/15",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          triggerClassName,
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {CurrentIcon && (
            <div
              className={cn(
                "rounded-[10px] flex items-center justify-center shrink-0",
                size === "sm" ? "w-6 h-6" : "w-7 h-7",
                selectedOption?.iconBgClassName || getTriggerIconBg(),
              )}
            >
              <CurrentIcon
                className={cn(
                  size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4",
                  selectedOption?.iconClassName,
                )}
              />
            </div>
          )}
          <span className="truncate font-semibold text-slate-700">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 ml-1.5 transition-all duration-200",
            isOpen ? "text-duo-dark rotate-180" : "text-slate-400",
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-labelledby={dropdownId}
          className={cn(
            "absolute left-0 w-full bg-white rounded-[13px] border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-xl z-50 py-1.5 flex flex-col max-h-60 sm:max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100",
            computedPlacement === "top"
              ? "bottom-full mb-1.5"
              : "top-full mt-1.5",
            menuClassName,
          )}
        >
          {menuHeader && (
            <div className="px-3.5 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider select-none">
              {menuHeader}
            </div>
          )}

          {options.map((opt) => {
            const isSelected = opt.value === value;
            const OptionIcon = opt.icon;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "w-full text-left font-semibold flex items-center gap-2 transition-colors cursor-pointer select-none",
                  size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
                  isSelected
                    ? getSelectedItemClasses()
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                  opt.disabled && "opacity-40 cursor-not-allowed",
                )}
              >
                {OptionIcon && (
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                      isSelected
                        ? getSelectedIconBg()
                        : "bg-duo-blue/10 text-duo-blue",
                      opt.iconBgClassName,
                    )}
                  >
                    <OptionIcon
                      className={cn("w-3.5 h-3.5", opt.iconClassName)}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <span className="block truncate font-semibold">
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="block text-[10px] text-slate-400 truncate font-normal">
                      {opt.description}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check
                    className={cn(
                      "w-3.5 h-3.5 shrink-0 ml-1.5",
                      getCheckmarkColor(),
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DuoDropdown;
