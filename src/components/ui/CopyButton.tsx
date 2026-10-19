"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils/cn";

type CopyVariant = "primary" | "outline" | "ghost" | "subtle";
type CopySize = "sm" | "xs";

interface CopyButtonProps {
  label: string;
  text?: string;
  getText?: () => Promise<string>;
  copiedLabel?: string;
  toastTitle?: string;
  variant?: CopyVariant;
  size?: CopySize;
  iconOnly?: boolean;
  className?: string;
  disabled?: boolean;
}

const VARIANT_CLASSES: Record<CopyVariant, string> = {
  primary:
    "bg-accent text-[#06101f] hover:bg-[#79b1ff] border border-transparent font-semibold",
  outline:
    "border border-edge bg-raised/70 text-ink hover:border-[#3b4b62] hover:bg-raised",
  ghost: "border border-transparent text-muted hover:bg-raised hover:text-ink",
  subtle:
    "border border-accent/30 bg-accent-soft/70 text-accent hover:border-accent/50 hover:bg-accent-soft",
};

const SIZE_CLASSES: Record<CopySize, string> = {
  sm: "h-8 px-3 text-[12px] gap-2",
  xs: "h-7 px-2 text-[11px] gap-1.5",
};

export function CopyButton({
  label,
  text,
  getText,
  copiedLabel = "Copied",
  toastTitle,
  variant = "outline",
  size = "sm",
  iconOnly = false,
  className,
  disabled = false,
}: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copying" | "copied">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const handleClick = async (): Promise<void> => {
    if (state === "copying" || disabled) {
      return;
    }

    setState("copying");

    try {
      const value = getText ? await getText() : text;

      if (!value) {
        setState("idle");
        pushToast({
          title: "Nothing to copy",
          description: "This file has no content yet.",
          variant: "error",
        });
        return;
      }

      const copied = await copyText(value);

      if (!copied) {
        setState("idle");
        pushToast({
          title: "Clipboard blocked",
          description: "Grant clipboard permission and try again.",
          variant: "error",
        });
        return;
      }

      setState("copied");
      pushToast({
        title: toastTitle ?? `${label} copied`,
        description: "Ready to paste into your editor or agent.",
        variant: "success",
      });

      timer.current = setTimeout(() => setState("idle"), 1800);
    } catch (error) {
      setState("idle");
      pushToast({
        title: "Copy failed",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "error",
      });
    }
  };

  const Icon =
    state === "copying" ? Loader2 : state === "copied" ? Check : Copy;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || state === "copying"}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        iconOnly && "w-8 px-0",
        className,
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", state === "copying" && "animate-spin")}
        aria-hidden="true"
      />
      {iconOnly ? null : <span>{state === "copied" ? copiedLabel : label}</span>}
    </button>
  );
}
