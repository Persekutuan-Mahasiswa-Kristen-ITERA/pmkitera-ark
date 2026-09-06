import { cn } from "@/lib/utils/cn";
import { LabelHTMLAttributes } from "react";

export function Label({
  className,
  children,
  required,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-accent ml-1">*</span>}
    </label>
  );
}
