"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, X } from "lucide-react";

import {
  CommitTimeline,
  TimelineLoader,
} from "@/components/history-diff/CommitTimeline";
import { describeApiError, fetchCommits } from "@/lib/client/api";
import type { CommitSummary } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface FileHistoryDrawerProps {
  open: boolean;
  path: string | null;
  onClose: () => void;
  onOpenCommit: (sha: string) => void;
}

export function FileHistoryDrawer({
  open,
  path,
  onClose,
  onOpenCommit,
}: FileHistoryDrawerProps) {
  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!open || !path) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchCommits({ path, perPage: 30, signal: controller.signal })
      .then((response) => {
        setCommits(response.commits);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(describeApiError(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, path, reloadToken]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const fileName = path?.split("/").pop() ?? "File";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[1px] animate-fade"
        aria-label="Close file history"
      />

      <aside className="relative flex h-full w-[min(440px,100vw)] animate-slide flex-col border-l border-edge bg-panel shadow-panel">
        <header className="flex items-start justify-between gap-3 border-b border-edge px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#8fb6ed]">
              <History className="h-3 w-3" aria-hidden="true" />
              File History
            </div>
            <h2 className="mt-1 truncate text-[14px] font-semibold text-ink">{fileName}</h2>
            <p className="mt-0.5 truncate font-mono text-[10px] text-[#71859f]">{path}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded border border-edge bg-raised/70 text-muted transition hover:text-ink disabled:opacity-50"
              aria-label="Reload file history"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded border border-edge bg-raised/70 text-muted transition hover:text-ink"
              aria-label="Close file history"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? <TimelineLoader /> : null}

          {!loading ? (
            <CommitTimeline
              commits={commits}
              error={error}
              onSelectCommit={onOpenCommit}
              onRetry={() => setReloadToken((token) => token + 1)}
              emptyTitle="No commits touched this file"
              emptyDescription="This file has no recorded history on the default branch yet."
              compact
            />
          ) : null}
        </div>

        <footer className="border-t border-edge px-4 py-2.5 text-[10px] leading-4 text-[#61748d]">
          Clicking a commit opens the structured diff. Historical blobs can be copied
          from inside the inspector.
        </footer>
      </aside>
    </div>
  );
}
