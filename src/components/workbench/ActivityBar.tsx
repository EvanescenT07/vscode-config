"use client";

import { Braces, Files, GitBranch, Search, Sparkles } from "lucide-react";

import { GitHubMark } from "@/components/ui/GitHubMark";

import type { WorkbenchView } from "@/components/workbench/view-types";
import { cn } from "@/lib/utils/cn";

interface ActivityBarProps {
  activeView: WorkbenchView;
  onSelectView: (view: WorkbenchView) => void;
  onOpenPalette: () => void;
  repoUrl: string;
}

const ITEMS: Array<{
  view: WorkbenchView;
  label: string;
  hotkey?: string;
  Icon: typeof Files;
}> = [
  { view: "explorer", label: "Explorer", Icon: Files },
  { view: "rules", label: "AI Agent Rules", Icon: Sparkles },
  { view: "history", label: "Source Control", Icon: GitBranch },
];

export function ActivityBar({
  activeView,
  onSelectView,
  onOpenPalette,
  repoUrl,
}: ActivityBarProps) {
  return (
    <nav
      aria-label="Workbench activity"
      className="hidden w-14 shrink-0 flex-col items-center border-r border-edge bg-panel/80 py-3 md:flex"
    >
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent shadow-glow">
        <Braces className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col items-center gap-1">
        {ITEMS.map(({ view, label, Icon }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => onSelectView(view)}
              title={label}
              aria-label={label}
              aria-pressed={active}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-raised hover:text-ink",
              )}
            >
              {active ? (
                <span className="absolute left-[-11px] h-5 w-[2px] rounded-full bg-accent" />
              ) : null}
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          );
        })}

        <div className="my-2 h-px w-6 bg-edge" />

        <button
          type="button"
          onClick={onOpenPalette}
          title="Command palette (Ctrl/Cmd + K)"
          aria-label="Open command palette"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          <Search className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>

      <a
        href={repoUrl}
        target="_blank"
        rel="noreferrer"
        title="Open source repository"
        aria-label="Open source repository on GitHub"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        <GitHubMark className="h-[18px] w-[18px]" />
      </a>
    </nav>
  );
}
