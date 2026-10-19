"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckSquare2,
  Layers,
  Search,
  Sparkles,
  Square,
  X,
} from "lucide-react";

import { CopyButton } from "@/components/ui/CopyButton";
import { FileTypeIcon } from "@/components/workbench/FileTypeIcon";
import { buildCombinedPrompt, fetchRawFile } from "@/lib/client/api";
import type { RepoFile, SearchIndex } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatBytes, formatNumber } from "@/lib/utils/format";

interface RulesHubProps {
  files: RepoFile[];
  index: SearchIndex | null;
  selectedRulePaths: Set<string>;
  onToggleRule: (path: string) => void;
  onClearRules: () => void;
  onOpenFile: (path: string) => void;
  loadingRules: boolean;
}

export function RulesHub({
  files,
  index,
  selectedRulePaths,
  onToggleRule,
  onClearRules,
  onOpenFile,
  loadingRules,
}: RulesHubProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return files;
    }
    return files.filter(
      (file) =>
        file.path.toLowerCase().includes(normalized) ||
        file.name.toLowerCase().includes(normalized),
    );
  }, [files, query]);

  const totalTokens = useMemo(
    () =>
      files.reduce(
        (total, file) =>
          total + (index?.tokenEstimates[file.path] ?? Math.ceil(file.size / 4)),
        0,
      ),
    [files, index],
  );

  const selectedPaths = useMemo(
    () => [...selectedRulePaths].sort((left, right) => left.localeCompare(right)),
    [selectedRulePaths],
  );

  const selectedTokens = useMemo(
    () =>
      selectedPaths.reduce((total, path) => {
        const file = files.find((candidate) => candidate.path === path);
        return (
          total +
          (index?.tokenEstimates[path] ?? (file ? Math.ceil(file.size / 4) : 0))
        );
      }, 0),
    [selectedPaths, files, index],
  );

  return (
    <div className="relative min-h-full pb-24">
      <section className="relative overflow-hidden border-b border-edge bg-panel/60">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-9">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ec5ff]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI Agent Rules Hub
          </div>
          <h1 className="mt-2 max-w-2xl text-balance text-[22px] font-semibold leading-tight tracking-tight text-ink sm:text-[28px]">
            Compose the exact context your agent needs.
          </h1>
          <p className="mt-2 max-w-xl text-[12.5px] leading-6 text-muted">
            Select rules across folders, estimate the prompt budget, and copy one
            concatenated system prompt with source markers preserved.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-edge bg-canvas/80 px-2.5 py-1 text-[10.5px] text-muted">
              <span className="font-mono text-ink">{files.length}</span> rule files
            </span>
            <span className="rounded-full border border-edge bg-canvas/80 px-2.5 py-1 text-[10.5px] text-muted">
              <span className="font-mono text-ink">
                {loadingRules ? "--" : `~${formatNumber(totalTokens)}`}
              </span>{" "}
              available tokens
            </span>
            <span className="rounded-full border border-accent/25 bg-accent-soft/60 px-2.5 py-1 text-[10.5px] text-[#9ec5ff]">
              Multi-select enabled
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
        <label className="relative mb-4 block w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter rules by name or path..."
            className="h-9 w-full rounded-md border border-edge bg-canvas/80 pl-9 pr-3 text-[12px] text-ink placeholder:text-[#5f7188] focus:border-accent/50 focus:outline-none"
            aria-label="Filter AI rules"
          />
        </label>

        {loadingRules && files.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-xl border border-edge bg-raised/40"
                style={{ animationDelay: `${item * 60}ms` }}
              />
            ))}
          </div>
        ) : null}

        {!loadingRules && files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-edge bg-raised/30 px-6 py-14 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
            <p className="mt-3 text-[14px] font-medium text-ink">No AI rule files found</p>
            <p className="mx-auto mt-1 max-w-sm text-[12px] leading-5 text-muted">
              Add Markdown rules under a rules, prompts, agents, skills, cursor, or
              copilot directory and refresh the tree.
            </p>
          </div>
        ) : null}

        {filtered.length === 0 && files.length > 0 ? (
          <div className="rounded-xl border border-dashed border-edge bg-raised/30 px-6 py-12 text-center">
            <p className="text-[13px] text-muted">No rules match “{query}”.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 text-[11.5px] text-accent hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((file) => {
              const selected = selectedRulePaths.has(file.path);
              const tokens =
                index?.tokenEstimates[file.path] ?? Math.ceil(file.size / 4);
              const headings = (index?.headings ?? [])
                .filter((heading) => heading.path === file.path)
                .slice(0, 3);

              return (
                <article
                  key={file.path}
                  onClick={() => onOpenFile(file.path)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenFile(file.path);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${file.path}`}
                  className={cn(
                    "group flex cursor-pointer flex-col rounded-xl border bg-panel/70 p-4 transition-colors",
                    selected
                      ? "border-accent/50 bg-[#0d1726] shadow-[0_0_0_1px_rgba(83,155,255,0.12)]"
                      : "border-edge hover:border-[#34445a] hover:bg-raised/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleRule(file.path);
                      }}
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition",
                        selected ? "text-accent" : "text-muted hover:text-ink",
                      )}
                      aria-label={selected ? `Deselect ${file.name}` : `Select ${file.name}`}
                      aria-pressed={selected}
                    >
                      {selected ? (
                        <CheckSquare2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Square className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>

                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <FileTypeIcon file={file} className="mt-1 h-4 w-4" />
                      <div className="min-w-0">
                        <h2 className="truncate text-[13px] font-semibold text-ink">
                          {file.name}
                        </h2>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-[#71859f]">
                          {file.path}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <span className="rounded border border-[#4a3a63] bg-[#181123] px-1.5 py-0.5 font-mono text-[9px] text-[#c9a5ff]">
                        ~{formatNumber(tokens)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex-1">
                    {headings.length > 0 ? (
                      <ul className="space-y-1">
                        {headings.map((heading) => (
                          <li
                            key={`${heading.slug}-${heading.depth}`}
                            className="flex items-center gap-1.5 text-[10.5px] text-[#8195ad]"
                            style={{ paddingLeft: (heading.depth - 1) * 8 }}
                          >
                            <span className="h-1 w-1 shrink-0 rounded-full bg-[#4b5d75]" />
                            <span className="truncate">{heading.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[10.5px] leading-5 text-[#61748d]">
                        Markdown rule file with {formatBytes(file.size)} of agent
                        instructions.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-edge/70 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted">
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      Open rule
                    </span>
                    <CopyButton
                      label="Copy rule"
                      getText={() => fetchRawFile(file.path).then((payload) => payload.raw)}
                      toastTitle={`${file.name} copied`}
                      variant="ghost"
                      size="xs"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedPaths.length > 0 ? (
        <div className="fixed bottom-10 left-1/2 z-40 w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 animate-rise">
          <div className="flex flex-col gap-2.5 rounded-xl border border-accent/35 bg-[#0b1421]/95 p-3 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-ink">
                  {selectedPaths.length} rule{selectedPaths.length === 1 ? "" : "s"} selected
                  <span className="ml-2 font-mono text-[10.5px] font-normal text-[#8fb6ed]">
                    ~{formatNumber(selectedTokens)} tokens
                  </span>
                </p>
                <p className="truncate text-[10px] text-[#71859f]">
                  {selectedPaths.join(" + ")}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onClearRules}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge bg-raised/70 px-2.5 text-[11px] text-muted transition hover:text-ink"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
              <CopyButton
                label="Copy Combined Prompt"
                getText={() => buildCombinedPrompt(selectedPaths)}
                toastTitle="Combined agent prompt copied"
                variant="primary"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
