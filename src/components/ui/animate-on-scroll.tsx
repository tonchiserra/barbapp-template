"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Singleton observer shared across all AnimateOnScroll instances
const callbacks = new Map<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function getObserver() {
  if (typeof window === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            callbacks.get(entry.target)?.();
            sharedObserver?.unobserve(entry.target);
            callbacks.delete(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );
  }
  return sharedObserver;
}

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** Animation delay in ms */
  delay?: number;
}

export function AnimateOnScroll({ children, className, delay = 0 }: AnimateOnScrollProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    const observer = getObserver();
    if (!el || !observer) return;

    callbacks.set(el, () => setIsVisible(true));
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
