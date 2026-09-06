"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl bg-card p-6 shadow-xl border border-line",
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <h3 className="text-lg font-serif font-bold text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-app-alt hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
