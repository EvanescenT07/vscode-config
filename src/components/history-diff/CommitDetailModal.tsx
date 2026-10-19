"use client";

import { useEffect } from "react";
import {
  ExternalLink,
  GitCommitHorizontal,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import { DiffViewer } from "@/components/history-diff/DiffViewer";
import type { CommitDetail } from "@/lib/types";
import { exactUtc, relativeTime } from "@/lib/utils/format";

interface CommitDetailModalProps {
  detail: CommitDetail | null;
  loading: boolean;
  error: string | null;
  repoUrl: string;
  onClose: () => void;
  onRetry: () => void;
}

export function CommitDetailModal({
  detail,
  loading,
  error,
  repoUrl,
  onClose,
  onRetry,
}: CommitDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Commit diff inspector"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-edge bg-panel shadow-panel sm:h-[92vh] sm:max-w-[min(1240px,calc(100vw-2.5rem))] sm:rounded-xl">
        <header className="shrink-0 border-b border-edge bg-[#0b121c]">
          <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent">
                <GitCommitHorizontal className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold text-ink">
                  {detail?.title ?? "Loading commit..."}
                </h2>
                {detail?.body ? (
                  <p className="mt-0.5 line-clamp-2 max-w-3xl text-[11px] leading-4 text-muted">
                    {detail.body}
                  </p>
                ) : null}

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                  {detail ? (
                    <>
                      <span className="font-mono text-[#8fb6ed]">{detail.shortSha}</span>
                      <span>{detail.author.login ?? detail.author.name}</span>
                      <span
                        title={exactUtc(detail.date)}
                        suppressHydrationWarning
                      >
                        {relativeTime(detail.date)}
                      </span>
                      <a
                        href={`${repoUrl}/commit/${detail.sha}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#8fb6ed] hover:underline"
                      >
                        GitHub
                        <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-edge bg-raised/70 text-muted transition hover:text-ink"
              aria-label="Close commit inspector"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Parsing unified patch into structured hunks...
            </div>
          </div>
        ) : null}

        {error && !loading ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-md rounded-xl border border-del/30 bg-[#1a1013] p-6 text-center">
              <p className="text-[13px] font-semibold text-ink">Diff unavailable</p>
              <p className="mt-1.5 text-[11.5px] leading-5 text-[#d3a8ad]">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-edge bg-raised px-3 py-1.5 text-[11.5px] text-ink"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {detail && !loading && !error ? <DiffViewer detail={detail} /> : null}
      </div>
    </div>
  );
}
