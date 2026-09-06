import { cn } from "@/lib/utils/cn";
import { SelectHTMLAttributes, forwardRef } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-md border border-line bg-card px-3.5 py-2 text-sm text-primary",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-red-600 focus:ring-red-600",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
