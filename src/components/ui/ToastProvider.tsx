"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type ToastVariant = "success" | "error" | "info";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastInput {
  id: number;
  variant: ToastVariant;
}

interface ToastContextValue {
  pushToast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-add/40 bg-[#0c1b16] text-[#d7f5e4]",
  error: "border-del/40 bg-[#1d1013] text-[#ffd9dc]",
  info: "border-accent/40 bg-[#0d1726] text-[#dbe9ff]",
};

const VARIANT_ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-add",
  error: "text-del",
  info: "text-accent",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }
  if (variant === "error") {
    return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
  }
  return <Info className="h-4 w-4" aria-hidden="true" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current;
      nextId.current += 1;

      setToasts((current) => [
        ...current.slice(-3),
        { id, variant: input.variant ?? "info", ...input },
      ]);

      const timer = setTimeout(() => dismiss(id), 3800);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      for (const timer of activeTimers.values()) {
        clearTimeout(timer);
      }
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-10 right-4 z-[120] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-panel backdrop-blur animate-rise",
              VARIANT_STYLES[toast.variant],
            )}
          >
            <span className={cn("mt-0.5", VARIANT_ICON_STYLES[toast.variant])}>
              <ToastIcon variant={toast.variant} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-5">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-[11.5px] leading-4 opacity-70">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 opacity-50 transition hover:bg-white/10 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
