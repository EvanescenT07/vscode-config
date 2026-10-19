"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Braces,
  Files,
  GitBranch,
  Menu,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { RulesHub } from "@/components/ai-rules/RulesHub";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { FileViewer } from "@/components/config-viewer/FileViewer";
import { CommitDetailModal } from "@/components/history-diff/CommitDetailModal";
import { FileHistoryDrawer } from "@/components/history-diff/FileHistoryDrawer";
import { HistoryView } from "@/components/history-diff/HistoryView";
import { ActivityBar } from "@/components/workbench/ActivityBar";
import { Explorer } from "@/components/workbench/Explorer";
import { StatusBar } from "@/components/workbench/StatusBar";
import type { WorkbenchView } from "@/components/workbench/view-types";
import { useToast } from "@/components/ui/ToastProvider";
import {
  describeApiError,
  fetchCommit,
  fetchFile,
  fetchSearchIndex,
  fetchTree,
} from "@/lib/client/api";
import type {
  CommitDetail,
  CommitListResponse,
  FilePayload,
  RepoFile,
  RepoTree,
  SearchIndex,
} from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface WorkbenchProps {
  initialTree: RepoTree | null;
  initialError: string | null;
  initialCommits?: CommitListResponse | null;
  initialView?: WorkbenchView;
}

function pickPrimaryFile(tree: RepoTree | null): string | null {
  if (!tree || tree.files.length === 0) {
    return null;
  }

  const settingsFiles = tree.files.filter(
    (file) => file.category === "ideConfigs" && /(^|\/)settings\.json$/i.test(file.path),
  );

  const meaningfulSettings = settingsFiles
    .filter((file) => file.size > 2)
    .sort((left, right) => right.size - left.size);

  if (meaningfulSettings.length > 0) {
    return meaningfulSettings[0].path;
  }

  const ideConfig = tree.files.find((file) => file.category === "ideConfigs");
  return ideConfig?.path ?? settingsFiles[0]?.path ?? tree.files[0]?.path ?? null;
}

function TreeErrorState({
  message,
  onRetry,
  refreshing,
}: {
  message: string;
  onRetry: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-xl border border-del/30 bg-[#170f12] p-6 text-center">
        <TriangleAlert className="mx-auto h-6 w-6 text-del" aria-hidden="true" />
        <h1 className="mt-3 text-[15px] font-semibold text-ink">
          Repository pipeline unavailable
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-[#d3a8ad]">{message}</p>
        <p className="mt-3 rounded-md border border-edge bg-black/20 px-3 py-2 text-left font-mono text-[10px] leading-5 text-[#8fa4c2]">
          Configure a read-only GITHUB_TOKEN in .env.local to raise the GitHub API
          limit from 60 to 5,000 requests per hour.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={refreshing}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-edge bg-raised px-3 py-1.5 text-[11.5px] text-ink transition hover:border-[#3b4b62] disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-3 w-3", refreshing && "animate-spin")}
            aria-hidden="true"
          />
          Retry pipeline
        </button>
      </div>
    </div>
  );
}

const MOBILE_VIEWS: Array<{
  view: WorkbenchView;
  label: string;
  Icon: typeof Files;
}> = [
  { view: "explorer", label: "Files", Icon: Files },
  { view: "rules", label: "Rules", Icon: Sparkles },
  { view: "history", label: "History", Icon: GitBranch },
];

export function Workbench({
  initialTree,
  initialError,
  initialCommits = null,
  initialView = "explorer",
}: WorkbenchProps) {
  const { pushToast } = useToast();
  const [tree, setTree] = useState<RepoTree | null>(initialTree);
  const [treeError, setTreeError] = useState<string | null>(initialError);
  const [refreshingTree, setRefreshingTree] = useState(false);
  const [activeView, setActiveView] = useState<WorkbenchView>(initialView);
  const [selectedPath, setSelectedPath] = useState<string | null>(() =>
    pickPrimaryFile(initialTree),
  );
  const [file, setFile] = useState<FilePayload | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileReloadToken, setFileReloadToken] = useState(0);
  const [selectedRulePaths, setSelectedRulePaths] = useState<Set<string>>(
    () => new Set(),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyPath, setHistoryPath] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [rulesIndex, setRulesIndex] = useState<SearchIndex | null>(null);
  const [rulesIndexLoading, setRulesIndexLoading] = useState(false);
  const [commitSha, setCommitSha] = useState<string | null>(null);
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitReloadToken, setCommitReloadToken] = useState(0);

  const repoUrl = tree
    ? `https://github.com/${tree.owner}/${tree.repo}`
    : "https://github.com/EvanescenT07/vscode-config";

  const aiRuleFiles = useMemo(
    () => tree?.files.filter((fileEntry) => fileEntry.category === "aiRules") ?? [],
    [tree],
  );

  const selectedFileMeta: RepoFile | null = useMemo(
    () => tree?.files.find((fileEntry) => fileEntry.path === selectedPath) ?? null,
    [tree, selectedPath],
  );

  const primaryFilePath = useMemo(() => pickPrimaryFile(tree), [tree]);

  useEffect(() => {
    if (!tree) {
      return;
    }

    setSelectedPath((current) => {
      if (current && tree.files.some((entry) => entry.path === current)) {
        return current;
      }
      return pickPrimaryFile(tree);
    });
  }, [tree]);

  useEffect(() => {
    if (!selectedPath) {
      setFile(null);
      setFileError(null);
      return;
    }

    const controller = new AbortController();
    setFileLoading(true);
    setFileError(null);
    setFile(null);

    fetchFile(selectedPath, controller.signal)
      .then((payload) => setFile(payload))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setFileError(describeApiError(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setFileLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedPath, fileReloadToken]);

  useEffect(() => {
    if (activeView !== "rules" || rulesIndex) {
      return;
    }

    const controller = new AbortController();
    setRulesIndexLoading(true);

    fetchSearchIndex(controller.signal)
      .then((value) => setRulesIndex(value))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        pushToast({
          title: "Search index unavailable",
          description: describeApiError(requestError),
          variant: "error",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRulesIndexLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeView, rulesIndex, pushToast]);

  useEffect(() => {
    if (!commitSha) {
      return;
    }

    const controller = new AbortController();
    setCommitLoading(true);
    setCommitError(null);
    setCommitDetail(null);

    fetchCommit(commitSha, controller.signal)
      .then((detail) => setCommitDetail(detail))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setCommitError(describeApiError(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCommitLoading(false);
        }
      });

    return () => controller.abort();
  }, [commitSha, commitReloadToken]);

  const refreshTree = useCallback(async (): Promise<void> => {
    setRefreshingTree(true);

    try {
      const nextTree = await fetchTree();
      setTree(nextTree);
      setTreeError(null);
      pushToast({
        title: "Repository tree refreshed",
        description: `${nextTree.files.length} files auto-detected on ${nextTree.branch}.`,
        variant: "success",
      });
    } catch (requestError) {
      const message = describeApiError(requestError);
      if (tree) {
        pushToast({
          title: "Refresh failed",
          description: message,
          variant: "error",
        });
      } else {
        setTreeError(message);
      }
    } finally {
      setRefreshingTree(false);
    }
  }, [tree, pushToast]);

  const handleSelectFile = useCallback((path: string): void => {
    setSelectedPath(path);
    setActiveView("explorer");
    setSidebarOpen(false);
  }, []);

  const handleToggleRule = useCallback((path: string): void => {
    setSelectedRulePaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleClearRules = useCallback((): void => {
    setSelectedRulePaths(new Set());
  }, []);

  const handleSetView = useCallback((view: WorkbenchView): void => {
    setActiveView(view);
    setSidebarOpen(false);
  }, []);

  const handleOpenCommit = useCallback((sha: string): void => {
    setCommitSha(sha);
  }, []);

  const handleCloseCommit = useCallback((): void => {
    setCommitSha(null);
    setCommitDetail(null);
    setCommitError(null);
    setCommitLoading(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const explorer = tree ? (
    <Explorer
      files={tree.files}
      selectedPath={selectedPath}
      selectedRulePaths={selectedRulePaths}
      onSelectFile={handleSelectFile}
      onToggleRule={handleToggleRule}
      onRefresh={() => void refreshTree()}
      refreshing={refreshingTree}
      onClose={() => setSidebarOpen(false)}
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-3 border-r border-edge bg-panel/70 px-4 text-center">
      <TriangleAlert className="h-5 w-5 text-del" aria-hidden="true" />
      <p className="text-[12px] text-muted">Explorer unavailable</p>
      <button
        type="button"
        onClick={() => void refreshTree()}
        disabled={refreshingTree}
        className="rounded border border-edge bg-raised px-2.5 py-1.5 text-[11px] text-ink disabled:opacity-50"
      >
        Retry
      </button>
    </div>
  );

  let mainContent: React.ReactNode;

  if (!tree) {
    mainContent = (
      <TreeErrorState
        message={treeError ?? "The repository tree could not be loaded."}
        onRetry={() => void refreshTree()}
        refreshing={refreshingTree}
      />
    );
  } else if (activeView === "rules") {
    mainContent = (
      <RulesHub
        files={aiRuleFiles}
        index={rulesIndex}
        selectedRulePaths={selectedRulePaths}
        onToggleRule={handleToggleRule}
        onClearRules={handleClearRules}
        onOpenFile={handleSelectFile}
        loadingRules={rulesIndexLoading}
      />
    );
  } else if (activeView === "history") {
    mainContent = (
      <HistoryView
        initialCommits={initialCommits}
        onOpenCommit={handleOpenCommit}
        repoUrl={repoUrl}
      />
    );
  } else {
    mainContent = (
      <FileViewer
        file={file}
        meta={selectedFileMeta}
        loading={fileLoading}
        error={fileError}
        repoUrl={repoUrl}
        branch={tree.branch}
        onOpenHistory={setHistoryPath}
        onRetry={() => setFileReloadToken((token) => token + 1)}
      />
    );
  }

  return (
    <>
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1">
          <ActivityBar
            activeView={activeView}
            onSelectView={handleSetView}
            onOpenPalette={() => setPaletteOpen(true)}
            repoUrl={repoUrl}
          />

          <div className="hidden w-[286px] shrink-0 md:block">{explorer}</div>

          <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center gap-2 border-b border-edge bg-panel/90 px-2 py-2 md:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-raised/70 text-muted"
                aria-label="Open file explorer"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <Braces className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                <span className="truncate text-[12px] font-medium text-ink">
                  {tree?.repo ?? "vscode-config"}
                </span>
              </div>

              <div className="flex items-center rounded-md border border-edge bg-canvas p-0.5">
                {MOBILE_VIEWS.map(({ view, label, Icon }) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => handleSetView(view)}
                    title={label}
                    aria-label={label}
                    aria-pressed={activeView === view}
                    className={cn(
                      "flex h-7 w-8 items-center justify-center rounded transition",
                      activeView === view
                        ? "bg-raised text-accent"
                        : "text-muted hover:text-ink",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-raised/70 text-muted"
                aria-label="Open command palette"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">{mainContent}</div>
          </main>
        </div>

        {tree ? (
          <StatusBar
            tree={tree}
            selectedFile={selectedFileMeta}
            repoUrl={repoUrl}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        ) : (
          <footer className="flex h-7 shrink-0 items-center justify-between border-t border-edge bg-[#08111d] px-3 text-[10.5px] text-[#9fb3cc]">
            <span className="text-[#f5c76a]">Pipeline offline</span>
            <button
              type="button"
              onClick={() => void refreshTree()}
              disabled={refreshingTree}
              className="transition hover:text-ink disabled:opacity-50"
            >
              Retry sync
            </button>
          </footer>
        )}
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-[55] md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 animate-fade"
            aria-label="Close explorer"
          />
          <div className="relative h-full w-[min(320px,88vw)] animate-slide">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-[-42px] top-2 flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-panel text-muted"
              aria-label="Close explorer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {explorer}
          </div>
        </div>
      ) : null}

      <FileHistoryDrawer
        open={historyPath !== null}
        path={historyPath}
        onClose={() => setHistoryPath(null)}
        onOpenCommit={handleOpenCommit}
      />

      {commitSha ? (
        <CommitDetailModal
          detail={commitDetail}
          loading={commitLoading}
          error={commitError}
          repoUrl={repoUrl}
          onClose={handleCloseCommit}
          onRetry={() => setCommitReloadToken((token) => token + 1)}
        />
      ) : null}

      <CommandPalette
        open={paletteOpen}
        tree={tree}
        primaryFilePath={primaryFilePath}
        onClose={() => setPaletteOpen(false)}
        onSelectFile={handleSelectFile}
        onSetView={handleSetView}
        onOpenCommit={handleOpenCommit}
        onRefreshTree={() => void refreshTree()}
      />
    </>
  );
}
