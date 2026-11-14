"use client";

import { createContext, use, useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const ToastContext = createContext<((message: string) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((next: string) => {
    setMessage(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-fg px-4 py-2.5 text-sm font-medium text-bg transition md:bottom-6",
          message ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        {message}
      </div>
    </ToastContext>
  );
}

export function useToast(): (message: string) => void {
  const show = use(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
