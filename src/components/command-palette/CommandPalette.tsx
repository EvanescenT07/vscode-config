"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Braces,
  Copy,
  CornerDownLeft,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import type { WorkbenchView } from "@/components/workbench/view-types";
import {
  describeApiError,
  fetchRawFile,
  fetchSearchIndex,
} from "@/lib/client/api";
import type { RepoTree, SearchIndex } from "@/lib/types";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

interface CommandPaletteProps {
  open: boolean;
  tree: RepoTree | null;
  primaryFilePath: string | null;
  onClose: () => void;
  onSelectFile: (path: string) => void;
  onSetView: (view: WorkbenchView) => void;
  onOpenCommit: (sha: string) => void;
  onRefreshTree: () => void;
}

interface PaletteItem {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: ReactNode;
  run: () => void;
}

const GROUP_ORDER = ["Actions", "Files", "JSON keys", "Rule sections"];

function matchScore(value: string, query: string): number {
  if (!query) {
    return 1;
  }

  const normalized = value.toLowerCase();
  if (normalized === query) {
    return 100;
  }
  if (normalized.startsWith(query)) {
    return 80;
  }
  if (normalized.includes(query)) {
    return 50;
  }

  const segments = normalized.split(/[/._\-\s]+/);
  if (segments.some((segment) => segment.startsWith(query))) {
    return 35;
  }

  return 0;
}

export function CommandPalette({
  open,
  tree,
  primaryFilePath,
  onClose,
  onSelectFile,
  onSetView,
  onOpenCommit,
  onRefreshTree,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setSelectedIndex(0);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open || index) {
      return;
    }

    const controller = new AbortController();
    setIndexLoading(true);
    setIndexError(null);

    fetchSearchIndex(controller.signal)
      .then((value) => setIndex(value))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setIndexError(describeApiError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIndexLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, index]);

  const actions = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    if (primaryFilePath) {
      items.push({
        id: "action-open-primary",
        group: "Actions",
        title: "Open primary IDE config",
        subtitle: primaryFilePath,
        icon: <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />,
        run: () => onSelectFile(primaryFilePath),
      });
      items.push({
        id: "action-copy-primary",
        group: "Actions",
        title: "Copy primary IDE config",
        subtitle: "Copy the raw file to the clipboard",
        icon: <Copy className="h-3.5 w-3.5" aria-hidden="true" />,
        run: () => {
          void fetchRawFile(primaryFilePath)
            .then((payload) => copyText(payload.raw))
            .then((copied) => {
              pushToast({
                title: copied ? "Primary config copied" : "Clipboard blocked",
                description: copied
                  ? primaryFilePath
                  : "Grant clipboard permission and try again.",
                variant: copied ? "success" : "error",
              });
            })
            .catch((error: unknown) => {
              pushToast({
                title: "Copy failed",
                description: describeApiError(error),
                variant: "error",
              });
            });
        },
      });
    }

    items.push({
      id: "action-rules",
      group: "Actions",
      title: "Compose AI rule bundle",
      subtitle: "Open the multi-rule prompt builder",
      icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />,
      run: () => onSetView("rules"),
    });

    items.push({
      id: "action-history",
      group: "Actions",
      title: "Browse commit history",
      subtitle: "Inspect global repository changes",
      icon: <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />,
      run: () => onSetView("history"),
    });

    if (tree?.latestSha) {
      items.push({
        id: "action-latest-commit",
        group: "Actions",
        title: "Inspect latest commit",
        subtitle: tree.latestCommitTitle,
        badge: tree.latestSha.slice(0, 7),
        icon: <GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden="true" />,
        run: () => onOpenCommit(tree.latestSha),
      });
    }

    items.push({
      id: "action-refresh",
      group: "Actions",
      title: "Refresh repository tree",
      subtitle: "Re-run the auto-detection pipeline",
      icon: <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />,
      run: onRefreshTree,
    });

    return items;
  }, [
    primaryFilePath,
    tree,
    onSelectFile,
    onSetView,
    onOpenCommit,
    onRefreshTree,
    pushToast,
  ]);

  const fileItems = useMemo<PaletteItem[]>(() => {
    if (!tree) {
      return [];
    }

    const normalized = query.trim().toLowerCase();

    return tree.files
      .map((file) => {
        const score = normalized
          ? Math.max(matchScore(file.path, normalized), matchScore(file.name, normalized))
          : 1;
        return { file, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.file.path.localeCompare(right.file.path);
      })
      .slice(0, normalized ? 8 : 10)
      .map(({ file }) => ({
        id: `file-${file.path}`,
        group: "Files",
        title: file.name,
        subtitle: file.path,
        badge: file.category === "aiRules" ? "rule" : file.extension,
        icon: <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />,
        run: () => onSelectFile(file.path),
      }));
  }, [tree, query, onSelectFile]);

  const jsonItems = useMemo<PaletteItem[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!index || !normalized) {
      return [];
    }

    return index.jsonKeys
      .map((entry) => ({
        entry,
        score: Math.max(
          matchScore(entry.key, normalized),
          matchScore(entry.path, normalized),
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map(({ entry }) => ({
        id: `key-${entry.path}-${entry.key}`,
        group: "JSON keys",
        title: entry.key,
        subtitle: `${entry.path} · ${entry.valuePreview}`,
        badge: "copy",
        icon: <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />,
        run: () => {
          void copyText(entry.copyText)
            .then((copied) => {
              pushToast({
                title: copied ? `Copied ${entry.key}` : "Clipboard blocked",
                variant: copied ? "success" : "error",
              });
            })
            .catch((error: unknown) => {
              pushToast({
                title: "Copy failed",
                description: describeApiError(error),
                variant: "error",
              });
            });
        },
      }));
  }, [index, query, pushToast]);

  const headingItems = useMemo<PaletteItem[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!index || !normalized) {
      return [];
    }

    return index.headings
      .map((entry) => ({
        entry,
        score: Math.max(
          matchScore(entry.text, normalized),
          matchScore(entry.path, normalized),
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 7)
      .map(({ entry }) => ({
        id: `heading-${entry.path}-${entry.slug}`,
        group: "Rule sections",
        title: entry.text,
        subtitle: entry.path,
        badge: `H${entry.depth}`,
        icon: <Braces className="h-3.5 w-3.5" aria-hidden="true" />,
        run: () => onSelectFile(entry.path),
      }));
  }, [index, query, onSelectFile]);

  const actionItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return actions;
    }
    return actions
      .map((action) => ({
        action,
        score: Math.max(
          matchScore(action.title, normalized),
          matchScore(action.subtitle, normalized),
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.action);
  }, [actions, query]);

  const groups = useMemo(
    () => [
      { name: "Actions", items: actionItems },
      { name: "Files", items: fileItems },
      { name: "JSON keys", items: jsonItems },
      { name: "Rule sections", items: headingItems },
    ],
    [actionItems, fileItems, jsonItems, headingItems],
  );

  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const runItem = (item: PaletteItem): void => {
    onClose();
    item.run();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) =>
        flatItems.length === 0 ? 0 : (current + 1) % flatItems.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) =>
        flatItems.length === 0
          ? 0
          : (current - 1 + flatItems.length) % flatItems.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) {
        runItem(item);
      }
    }
  };

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-3 pt-[9vh] backdrop-blur-sm sm:px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[620px] overflow-hidden rounded-xl border border-edge bg-[#0b121c] shadow-panel animate-rise">
        <div className="flex items-center gap-2.5 border-b border-edge px-3.5 py-3">
          <Search className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search files, JSON keys, rule headings, or actions..."
            className="h-6 flex-1 bg-transparent text-[13px] text-ink placeholder:text-[#5f7188] focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-autocomplete="list"
          />
          {indexLoading ? (
            <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Indexing
            </span>
          ) : (
            <kbd className="shrink-0 rounded border border-edge bg-raised px-1.5 py-0.5 font-mono text-[9.5px] text-muted">
              ESC
            </kbd>
          )}
        </div>

        <div
          id="command-palette-results"
          className="max-h-[min(62vh,520px)] overflow-y-auto py-1.5"
          role="listbox"
        >
          {flatItems.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[12.5px] text-muted">
                No results for “{query}”.
              </p>
              <p className="mt-1 text-[10.5px] text-[#61748d]">
                Try a setting name like “fontSize” or a path fragment.
              </p>
              {indexError ? (
                <p className="mt-2 text-[10.5px] text-del">{indexError}</p>
              ) : null}
            </div>
          ) : (
            GROUP_ORDER.map((groupName) => {
              const group = groups.find((candidate) => candidate.name === groupName);
              if (!group || group.items.length === 0) {
                return null;
              }

              return (
                <div key={group.name} className="mb-1">
                  <div className="px-3.5 pb-1 pt-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#61748d]">
                    {group.name}
                  </div>
                  {group.items.map((item) => {
                    runningIndex += 1;
                    const isActive = runningIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        ref={isActive ? activeItemRef : null}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setSelectedIndex(runningIndex)}
                        onClick={() => runItem(item)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors",
                          isActive ? "bg-accent-soft/80" : "hover:bg-raised/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded border",
                            isActive
                              ? "border-accent/30 bg-accent/10 text-accent"
                              : "border-edge bg-raised text-muted",
                          )}
                        >
                          {item.icon}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] text-ink">
                            {item.title}
                          </span>
                          <span className="block truncate font-mono text-[9.5px] text-[#71859f]">
                            {item.subtitle}
                          </span>
                        </span>

                        {item.badge ? (
                          <span className="shrink-0 rounded border border-edge bg-canvas px-1.5 py-0.5 font-mono text-[9px] text-[#8fb6ed]">
                            {item.badge}
                          </span>
                        ) : null}

                        {isActive ? (
                          <CornerDownLeft
                            className="h-3 w-3 shrink-0 text-muted"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge bg-panel/60 px-3.5 py-2 text-[9.5px] text-[#61748d]">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-edge bg-raised px-1 py-0.5 font-mono">
                ↑
              </kbd>
              <kbd className="rounded border border-edge bg-raised px-1 py-0.5 font-mono">
                ↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-edge bg-raised px-1 py-0.5 font-mono">
                ↵
              </kbd>
              open
            </span>
          </span>
          <span className="flex items-center gap-1">
            <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
            {index
              ? `${formatNumber(index.jsonKeys.length)} keys · ${formatNumber(index.headings.length)} sections indexed`
              : "Search index loads on demand"}
          </span>
        </div>
      </div>
    </div>
  );
}
