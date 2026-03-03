"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((message: string, variant: ToastVariant) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, 3000);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg",
              t.leaving ? "animate-toast-out" : "animate-toast-in",
              t.variant === "success" && "bg-foreground text-background",
              t.variant === "error" && "bg-destructive text-destructive-foreground",
            )}
          >
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
