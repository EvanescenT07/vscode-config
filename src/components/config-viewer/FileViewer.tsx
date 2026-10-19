"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
  ExternalLink,
  History,
  KeyRound,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import { CodeViewer } from "@/components/config-viewer/CodeViewer";
import { JsonKeyExplorer } from "@/components/config-viewer/JsonKeyExplorer";
import { MarkdownView } from "@/components/config-viewer/MarkdownView";
import { FileTypeIcon } from "@/components/workbench/FileTypeIcon";
import { CopyButton } from "@/components/ui/CopyButton";
import type { FilePayload, RepoFile } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatBytes, formatNumber } from "@/lib/utils/format";

type ViewMode = "raw" | "explorer" | "rendered";

interface FileViewerProps {
  file: FilePayload | null;
  meta: RepoFile | null;
  loading: boolean;
  error: string | null;
  repoUrl: string;
  branch: string;
  onOpenHistory: (path: string) => void;
  onRetry: () => void;
}

function ViewTab({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Code2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11.5px] transition-colors",
        active
          ? "bg-raised text-ink shadow-sm"
          : "text-muted hover:bg-raised/60 hover:text-ink",
      )}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8">
      <div className="mb-6 flex items-center gap-2 text-[12px] text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Parsing file on the Node.js runtime...
      </div>
      <div className="space-y-3">
        {[72, 54, 86, 41, 67, 58, 78, 36, 63, 49].map((width, index) => (
          <div
            key={`${width}-${index}`}
            className="h-3 animate-pulse rounded bg-raised"
            style={{
              width: `${width}%`,
              animationDelay: `${index * 45}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function FileViewer({
  file,
  meta,
  loading,
  error,
  repoUrl,
  branch,
  onOpenHistory,
  onRetry,
}: FileViewerProps) {
  const [mode, setMode] = useState<ViewMode>("raw");
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const filePath = file?.path ?? meta?.path ?? "";

  useEffect(() => {
    if (!file) {
      return;
    }
    setMode(file.language === "markdown" ? "rendered" : "raw");
    setCopyMenuOpen(false);
  }, [file]);

  useEffect(() => {
    if (!copyMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setCopyMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setCopyMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [copyMenuOpen]);

  if (!file && !loading && !error) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-edge bg-raised">
            <Code2 className="h-5 w-5 text-muted" aria-hidden="true" />
          </div>
          <p className="text-[14px] font-medium text-ink">Select a file to inspect</p>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            Pick an IDE config or AI rule from the explorer, or press Ctrl/Cmd + K
            to search everything.
          </p>
        </div>
      </div>
    );
  }

  const isMarkdown = file?.language === "markdown";
  const isJson = Boolean(file && /\.(json|jsonc)$/i.test(file.path));
  const copyLabel = file
    ? file.path.includes("extensions")
      ? "Copy Extension List"
      : meta?.category === "aiRules"
        ? "Copy Rule"
        : meta?.category === "ideConfigs"
          ? "Copy Config"
          : "Copy File"
    : "Copy File";
  const lineCount = file ? file.raw.split(/\r?\n/).length : 0;
  const segments = filePath.split("/").filter(Boolean);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-edge bg-panel/95 backdrop-blur">
        <div className="border-b border-edge/70 px-3 py-2 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10.5px] text-muted">
            <span className="font-medium text-[#8ec0ff]">
              {meta ? CATEGORY_LABELS[meta.category] : "Repository"}
            </span>
            {segments.map((segment, index) => (
              <span key={`${segment}-${index}`} className="flex items-center gap-1.5">
                <ChevronRight className="h-2.5 w-2.5 text-[#4c5c72]" aria-hidden="true" />
                <span className={index === segments.length - 1 ? "text-[#b7c6da]" : ""}>
                  {segment}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-3 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {meta ? <FileTypeIcon file={meta} className="h-4 w-4" /> : null}
                <h1 className="truncate text-[15px] font-semibold tracking-tight text-ink">
                  {meta?.name ?? filePath.split("/").pop() ?? "File"}
                </h1>
                {file?.tokenEstimate ? (
                  <span className="shrink-0 rounded-full border border-[#4a3a63] bg-[#181123] px-2 py-0.5 font-mono text-[9.5px] text-[#c9a5ff]">
                    ~{formatNumber(file.tokenEstimate)} tokens
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted">
                <span className="font-mono text-[#7b8ea8]">{filePath}</span>
                {file ? (
                  <>
                    <span>{formatBytes(file.size)}</span>
                    <span>{lineCount} lines</span>
                    <span className="rounded border border-edge bg-canvas px-1.5 py-0.5 font-mono text-[9.5px]">
                      {file.ref.slice(0, 7)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`${repoUrl}/blob/${branch}/${filePath}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge bg-raised/70 px-2.5 text-[11.5px] text-muted transition hover:border-[#3b4b62] hover:text-ink"
                title="Open this file on GitHub"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">GitHub</span>
              </a>

              <button
                type="button"
                onClick={() => filePath && onOpenHistory(filePath)}
                disabled={!filePath}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge bg-raised/70 px-2.5 text-[11.5px] text-muted transition hover:border-[#3b4b62] hover:text-ink disabled:opacity-50"
                title="Show commit history for this file"
              >
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">History</span>
              </button>

              <div className="relative flex items-stretch" ref={menuRef}>
                <CopyButton
                  label={copyLabel}
                  text={file?.raw}
                  toastTitle={`${copyLabel} succeeded`}
                  variant="primary"
                  disabled={!file}
                  className={isJson ? "rounded-r-none" : undefined}
                />

                {isJson ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setCopyMenuOpen((open) => !open)}
                      className="inline-flex h-8 w-7 items-center justify-center rounded-r-md border border-l border-l-[#06101f]/20 border-transparent bg-accent text-[#06101f] transition hover:bg-[#79b1ff]"
                      aria-label="More copy options"
                      aria-expanded={copyMenuOpen}
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>

                    {copyMenuOpen ? (
                      <div className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-lg border border-edge bg-panel p-1.5 shadow-panel animate-rise">
                        <div className="px-2 pb-1.5 pt-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#61748d]">
                          Copy format
                        </div>
                        <CopyButton
                          label="Raw JSONC (with comments)"
                          text={file?.raw}
                          toastTitle="Raw JSONC copied"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                        />
                        <CopyButton
                          label="Strict JSON (comments stripped)"
                          text={file?.strippedJson ?? undefined}
                          toastTitle="Strict JSON copied"
                          variant="ghost"
                          size="sm"
                          disabled={!file?.strippedJson}
                          className="w-full justify-start"
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-md border border-edge bg-canvas p-0.5">
              {isJson ? (
                <>
                  <ViewTab
                    active={mode === "raw"}
                    onClick={() => setMode("raw")}
                    Icon={Code2}
                    label="Raw File"
                  />
                  <ViewTab
                    active={mode === "explorer"}
                    onClick={() => setMode("explorer")}
                    Icon={KeyRound}
                    label="Key Explorer"
                  />
                </>
              ) : isMarkdown ? (
                <>
                  <ViewTab
                    active={mode === "rendered"}
                    onClick={() => setMode("rendered")}
                    Icon={Eye}
                    label="Rendered"
                  />
                  <ViewTab
                    active={mode === "raw"}
                    onClick={() => setMode("raw")}
                    Icon={Code2}
                    label="Raw Prompt"
                  />
                </>
              ) : (
                <ViewTab
                  active
                  onClick={() => setMode("raw")}
                  Icon={Code2}
                  label="Raw File"
                />
              )}
            </div>

            {file?.extensionCli ? (
              <span className="rounded-full border border-add/30 bg-add/10 px-2 py-1 text-[9.5px] font-medium uppercase tracking-wide text-add">
                Extension list detected
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-canvas/40">
        {loading ? <LoadingState /> : null}

        {error && !loading ? (
          <div className="flex min-h-[320px] items-center justify-center px-6 py-12">
            <div className="max-w-md rounded-xl border border-del/30 bg-[#1a1013] p-6 text-center">
              <TriangleAlert className="mx-auto h-6 w-6 text-del" aria-hidden="true" />
              <p className="mt-3 text-[14px] font-semibold text-ink">
                Could not load this file
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-[#d3a8ad]">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-edge bg-raised px-3 py-1.5 text-[11.5px] text-ink transition hover:border-[#3b4b62]"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {file && !loading && !error ? (
          <>
            {file.extensionCli ? (
              <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6">
                <div className="rounded-lg border border-add/25 bg-[linear-gradient(120deg,rgba(10,30,21,0.9),rgba(11,18,26,0.9))] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7edca9]">
                        Quick install
                      </p>
                      <p className="mt-1 font-mono text-[11px] leading-5 text-[#c6e9d6]">
                        {file.extensionCli.length > 140
                          ? `${file.extensionCli.slice(0, 137)}...`
                          : file.extensionCli}
                      </p>
                    </div>
                    <CopyButton
                      label="Copy CLI command"
                      text={file.extensionCli}
                      toastTitle="Extension install command copied"
                      variant="subtle"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "raw" || (!isJson && !isMarkdown) ? (
              <CodeViewer highlightedHtml={file.highlightedHtml} />
            ) : null}

            {mode === "explorer" && isJson ? (
              <JsonKeyExplorer entries={file.jsonEntries} />
            ) : null}

            {mode === "rendered" && isMarkdown ? (
              <MarkdownView content={file.raw} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
