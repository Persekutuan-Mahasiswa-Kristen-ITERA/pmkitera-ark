"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Stop loading state on path or searchParams change
  useEffect(() => {
    setIsLoading(false);
    setProgress(100);

    const timer = setTimeout(() => {
      setProgress(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Handle document title indicator & progress bar animation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLoading) {
      setProgress(20);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 150);

      // Add loading indicator to tab title
      const originalTitle = document.title;
      if (!originalTitle.startsWith("⏳")) {
        document.title = `⏳ Memuat... | PMK ARK`;
      }

      return () => {
        clearInterval(interval);
        // Restore title when loading stops or unmounts
        if (document.title.startsWith("⏳")) {
          document.title = originalTitle;
        }
      };
    }
  }, [isLoading]);

  // Global click listener for links and buttons that navigate
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Skip external links, new tab links, hash links, or download links
      if (
        !href ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        targetAttr === "_blank" ||
        target.hasAttribute("download")
      ) {
        return;
      }

      const currentUrl = window.location.pathname + window.location.search;
      // If navigating to a different URL
      if (href !== currentUrl && href !== window.location.pathname) {
        setIsLoading(true);
      }
    };

    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form && form.method.toLowerCase() === "get") {
        setIsLoading(true);
      }
    };

    // Attach listener to all matching <a> elements and forms
    const anchors = document.querySelectorAll("a[href]");
    anchors.forEach((anchor) => {
      anchor.addEventListener("click", handleAnchorClick as EventListener);
    });

    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", handleFormSubmit as EventListener);
    });

    // Use MutationObserver to watch for dynamically added links
    const observer = new MutationObserver(() => {
      const currentAnchors = document.querySelectorAll("a[href]");
      currentAnchors.forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick as EventListener);
        anchor.addEventListener("click", handleAnchorClick as EventListener);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      anchors.forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick as EventListener);
      });
      forms.forEach((form) => {
        form.removeEventListener("submit", handleFormSubmit as EventListener);
      });
      observer.disconnect();
    };
  }, [pathname, searchParams]);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* Top Bar Progress Line */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-transparent">
        <div
          className="h-full bg-accent transition-all duration-200 ease-out shadow-[0_0_10px_var(--color-accent)]"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
            transition: progress === 100 ? "opacity 300ms ease-out, width 200ms ease-out" : "width 200ms ease-out",
          }}
        />
      </div>

      {/* Floating Spinner Pill Indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-line shadow-lg text-xs font-semibold text-primary">
            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
            <span>Memuat...</span>
          </div>
        </div>
      )}
    </>
  );
}
