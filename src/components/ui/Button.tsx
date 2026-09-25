import {
  TactileButton,
  TactileButtonProps,
  ButtonVariant,
  ButtonSize,
} from "./TactileButton";

export type ButtonProps = TactileButtonProps;
export type { ButtonVariant, ButtonSize };

/**
 * Universal Button component for the EduPlay Quiz Studio platform.
 * Alias to TactileButton, serving as the single source of truth for all button styles,
 * variants, sizes, and interactive states across the application.
 */
export const Button = TactileButton;
export default Button;
