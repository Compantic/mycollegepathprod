"use client";

import React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

type ToastContextValue = {
  toasts: ToastItem[];
  toast: (options: ToastOptions) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

/** Safe hook: returns toast function or no-op if outside provider (e.g. in API route or server). */
export function useToastOptional(): Pick<ToastContextValue, "toast"> {
  const ctx = React.useContext(ToastContext);
  return {
    toast: ctx?.toast ?? (() => {}),
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = React.useMemo(() => ({ toasts, toast }), [toasts, toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider duration={5000} label="Notification">
        {children}
        <ToastPrimitive.Viewport
          className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 outline-none sm:max-w-[380px]"
          style={{ listStyle: "none" }}
        />
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.duration ?? 5000}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
            className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full grid gap-1 rounded-lg border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)]"
          >
            {t.title && (
              <ToastPrimitive.Title className="text-sm font-semibold text-[var(--foreground)]">
                {t.title}
              </ToastPrimitive.Title>
            )}
            <ToastPrimitive.Description className="text-sm text-[var(--muted-foreground)]">
              {t.description}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close
              aria-label="Dismiss"
              className="absolute right-2 top-2 rounded p-1 opacity-70 hover:opacity-100 focus:opacity-100"
            />
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
