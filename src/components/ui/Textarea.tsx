import { cn } from "@/lib/utils/cn";
import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-[90px] w-full rounded-md border border-line bg-card px-3.5 py-2 text-sm text-primary",
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
Textarea.displayName = "Textarea";
