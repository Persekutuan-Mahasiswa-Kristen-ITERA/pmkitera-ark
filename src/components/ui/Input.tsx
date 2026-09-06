import { cn } from "@/lib/utils/cn";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-md border border-line bg-card px-3.5 py-2 text-sm text-primary",
            "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-red-600 focus:ring-red-600",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
