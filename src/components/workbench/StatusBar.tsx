"use client";

import {
  CircleDot,
  GitBranch,
  GitCommitHorizontal,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import type { RepoFile, RepoTree } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/format";

interface StatusBarProps {
  tree: RepoTree;
  selectedFile: RepoFile | null;
  repoUrl: string;
  onOpenPalette: () => void;
}

export function StatusBar({
  tree,
  selectedFile,
  repoUrl,
  onOpenPalette,
}: StatusBarProps) {
  const remaining = tree.rateLimit.remaining;
  const isHealthy = remaining === null || remaining > 10;

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-edge bg-[#08111d] px-2 text-[10.5px] text-[#9fb3cc] sm:px-3">
      <div className="flex min-w-0 items-center gap-1">
        <span className="flex h-full items-center gap-1 bg-accent/15 px-2 text-[#9ec5ff]">
          <GitBranch className="h-3 w-3" aria-hidden="true" />
          <span className="font-medium">{tree.branch}</span>
        </span>

        <span
          className="hidden items-center gap-1 px-1.5 sm:flex"
          suppressHydrationWarning
        >
          <CircleDot className="h-2.5 w-2.5 text-add" aria-hidden="true" />
          <span>Synced {relativeTime(tree.generatedAt)}</span>
        </span>

        {tree.latestSha ? (
          <a
            href={`${repoUrl}/commit/${tree.latestSha}`}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 px-1.5 transition hover:text-ink md:flex"
            title={tree.latestCommitTitle}
          >
            <GitCommitHorizontal className="h-3 w-3" aria-hidden="true" />
            <span className="font-mono">{tree.latestSha.slice(0, 7)}</span>
          </a>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0">
        {selectedFile ? (
          <span className="hidden px-2 text-[#7e93ad] sm:inline">
            {CATEGORY_LABELS[selectedFile.category]}
          </span>
        ) : null}

        <span className="hidden px-2 text-[#7e93ad] lg:inline">
          {selectedFile?.language ?? "UTF-8"}
        </span>

        <span
          className={cn(
            "hidden items-center gap-1 px-2 sm:flex",
            isHealthy ? "text-[#84d6a8]" : "text-[#f5c76a]",
          )}
          title={
            remaining === null
              ? "GitHub rate limit not reported yet"
              : `${remaining} of ${tree.rateLimit.limit ?? "?"} GitHub API requests remaining`
          }
        >
          {isHealthy ? (
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          ) : (
            <TriangleAlert className="h-3 w-3" aria-hidden="true" />
          )}
          <span>{isHealthy ? "API healthy" : "API throttled"}</span>
        </span>

        <button
          type="button"
          onClick={onOpenPalette}
          className="flex items-center gap-1 px-2 transition hover:text-ink"
          title="Open command palette"
        >
          <span className="font-mono text-[10px]">Ctrl K</span>
        </button>
      </div>
    </footer>
  );
}
