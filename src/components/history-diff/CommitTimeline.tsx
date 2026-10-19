"use client";

import { GitCommitHorizontal, Loader2, RefreshCw } from "lucide-react";

import type { CommitSummary } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { exactUtc, relativeTime } from "@/lib/utils/format";

interface CommitTimelineProps {
  commits: CommitSummary[];
  loading?: boolean;
  error?: string | null;
  activeSha?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onSelectCommit: (sha: string) => void;
  onRetry?: () => void;
  compact?: boolean;
}

function AuthorAvatar({ commit }: { commit: CommitSummary }) {
  if (commit.author.avatarUrl) {
    return (
      <img
        src={commit.author.avatarUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full border border-edge"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-edge bg-raised text-[10px] font-semibold text-muted">
      {commit.author.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function CommitTimeline({
  commits,
  loading = false,
  error = null,
  activeSha = null,
  emptyTitle = "No commits yet",
  emptyDescription = "Push a change to the repository to populate the timeline.",
  onSelectCommit,
  onRetry,
  compact = false,
}: CommitTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-2 px-3 py-3">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-16 animate-pulse rounded-lg border border-edge bg-raised/40"
            style={{ animationDelay: `${item * 60}ms` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-3 rounded-lg border border-del/30 bg-[#1a1013] px-4 py-5 text-center">
        <p className="text-[12px] text-[#ffd9dc]">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded border border-edge bg-raised px-2.5 py-1.5 text-[11px] text-ink"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="m-3 rounded-lg border border-dashed border-edge bg-raised/30 px-5 py-10 text-center">
        <GitCommitHorizontal className="mx-auto h-5 w-5 text-muted" aria-hidden="true" />
        <p className="mt-2 text-[13px] font-medium text-ink">{emptyTitle}</p>
        <p className="mx-auto mt-1 max-w-xs text-[11.5px] leading-5 text-muted">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <ul className={cn("divide-y divide-edge/60", compact && "text-[11.5px]")}>
      {commits.map((commit) => {
        const active = activeSha === commit.sha;
        const hasStats =
          typeof commit.additions === "number" && typeof commit.deletions === "number";

        return (
          <li key={commit.sha}>
            <button
              type="button"
              onClick={() => onSelectCommit(commit.sha)}
              className={cn(
                "group flex w-full items-start gap-3 px-3 py-3 text-left transition-colors sm:px-4",
                active ? "bg-accent-soft/60" : "hover:bg-raised/60",
              )}
            >
              <AuthorAvatar commit={commit} />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-[12px] font-medium leading-5 text-ink">
                    {commit.title}
                  </p>
                  {hasStats ? (
                    <span className="shrink-0 rounded border border-edge bg-canvas px-1.5 py-0.5 font-mono text-[9px]">
                      <span className="text-add">+{commit.additions}</span>{" "}
                      <span className="text-del">-{commit.deletions}</span>
                    </span>
                  ) : null}
                </div>

                {commit.body && !compact ? (
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-4 text-[#71859f]">
                    {commit.body}
                  </p>
                ) : null}

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-muted">
                  <span className="font-mono text-[#8fb6ed]">{commit.shortSha}</span>
                  <span className="truncate">{commit.author.login ?? commit.author.name}</span>
                  <span
                    className="whitespace-nowrap"
                    title={exactUtc(commit.date)}
                    suppressHydrationWarning
                  >
                    {relativeTime(commit.date)}
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function TimelineLoader() {
  return (
    <div className="flex items-center justify-center gap-2 py-5 text-[11px] text-muted">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      Loading commits...
    </div>
  );
}
