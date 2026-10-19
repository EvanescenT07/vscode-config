"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, RefreshCw } from "lucide-react";

import {
  CommitTimeline,
  TimelineLoader,
} from "@/components/history-diff/CommitTimeline";
import { describeApiError, fetchCommits } from "@/lib/client/api";
import type { CommitListResponse, CommitSummary } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface HistoryViewProps {
  initialCommits: CommitListResponse | null;
  onOpenCommit: (sha: string) => void;
  repoUrl: string;
}

export function HistoryView({
  initialCommits,
  onOpenCommit,
  repoUrl,
}: HistoryViewProps) {
  const [commits, setCommits] = useState<CommitSummary[]>(
    initialCommits?.commits ?? [],
  );
  const [hasMore, setHasMore] = useState(initialCommits?.hasMore ?? false);
  const [page, setPage] = useState(initialCommits?.page ?? 1);
  const [loading, setLoading] = useState(!initialCommits);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchCommits({ page: 1, perPage: 30 });
      setCommits(response.commits);
      setHasMore(response.hasMore);
      setPage(1);
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCommits) {
      void loadFirstPage();
    }
  }, [initialCommits, loadFirstPage]);

  const loadMore = async (): Promise<void> => {
    if (loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const response = await fetchCommits({ page: page + 1, perPage: 30 });
      setCommits((current) => [...current, ...response.commits]);
      setHasMore(response.hasMore);
      setPage((current) => current + 1);
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-full">
      <section className="relative overflow-hidden border-b border-edge bg-panel/60">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#3b82f6]/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-7 sm:px-6">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ec5ff]">
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            Source Control
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">
            Repository change history
          </h1>
          <p className="mt-2 max-w-xl text-[12.5px] leading-6 text-muted">
            Inspect every commit, parse structured diffs, and copy any file exactly
            as it existed at that revision.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`${repoUrl}/commits`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-edge bg-canvas/80 px-2.5 py-1 text-[10.5px] text-muted transition hover:text-ink"
            >
              Open commit log on GitHub
            </a>
            <button
              type="button"
              onClick={() => void loadFirstPage()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-canvas/80 px-2.5 py-1 text-[10.5px] text-muted transition hover:text-ink disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-3 w-3", loading && "animate-spin")}
                aria-hidden="true"
              />
              Refresh timeline
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-edge bg-panel/60">
          <div className="flex items-center justify-between border-b border-edge px-3 py-2 sm:px-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Commit timeline
            </span>
            <span className="font-mono text-[10px] text-[#71859f]">
              {commits.length} loaded
            </span>
          </div>

          <CommitTimeline
            commits={commits}
            loading={loading}
            error={error}
            onSelectCommit={onOpenCommit}
            onRetry={() => void loadFirstPage()}
            emptyTitle="No commits returned"
            emptyDescription="The repository may be empty, or the GitHub token lacks read access."
          />

          {hasMore ? (
            <div className="flex justify-center border-t border-edge px-3 py-3">
              {loadingMore ? (
                <TimelineLoader />
              ) : (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  className="rounded-md border border-edge bg-raised/70 px-3 py-1.5 text-[11px] text-muted transition hover:text-ink"
                >
                  Load older commits
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
