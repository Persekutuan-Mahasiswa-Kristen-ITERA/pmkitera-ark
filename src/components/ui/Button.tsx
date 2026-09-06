import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-card hover:bg-accent-hover focus-visible:ring-accent",
  secondary:
    "bg-card text-primary border border-line hover:bg-app-alt",
  outline:
    "bg-transparent text-primary border border-line hover:bg-app-alt",
  danger:
    "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600",
  ghost:
    "bg-transparent text-muted hover:bg-app-alt hover:text-primary",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium",
          "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
