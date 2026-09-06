import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-card border border-line rounded-xl shadow-xs", className)}
      {...props}
    >
      {children}
    </div>
  );
}
