import { cn } from "@/lib/utils/cn";

export interface BadgeProps {
  variant?: "published" | "draft" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  const styles = {
    published: "bg-emerald-100 text-emerald-800 border-emerald-200",
    draft: "bg-amber-100 text-amber-800 border-amber-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    neutral: "bg-app-alt text-muted border-line",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
