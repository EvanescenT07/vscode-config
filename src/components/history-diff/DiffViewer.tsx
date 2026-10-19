"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Columns2,
  FileCode2,
  Rows3,
  TriangleAlert,
} from "lucide-react";

import { CopyButton } from "@/components/ui/CopyButton";
import { fetchRawFile } from "@/lib/client/api";
import type { CommitDetail, DiffFile, DiffLine } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type DiffMode = "unified" | "split";

interface DiffViewerProps {
  detail: CommitDetail;
}

const LINE_BACKGROUND: Record<DiffLine["type"], string> = {
  add: "bg-add/[0.09]",
  del: "bg-del/[0.09]",
  normal: "bg-transparent",
};

const LINE_TEXT: Record<DiffLine["type"], string> = {
  add: "text-[#c9f2da]",
  del: "text-[#ffd4d7]",
  normal: "text-[#c3d0e0]",
};

const PREFIX: Record<DiffLine["type"], string> = {
  add: "+",
  del: "-",
  normal: " ",
};

function FileIcon() {
  return <FileCode2 className="h-3.5 w-3.5 text-[#f0c674]" aria-hidden="true" />;
}

function UnifiedFile({ file }: { file: DiffFile }) {
  return (
    <div className="min-w-[720px] font-mono text-[11px] leading-[1.65]">
      {file.hunks.map((hunk, hunkIndex) => (
        <div key={`${hunk.header}-${hunkIndex}`}>
          <div className="border-y border-[#233246] bg-[#0c1826] px-3 py-1 text-[10.5px] text-[#78a9e8]">
            {hunk.header}
          </div>
          {hunk.lines.map((line, lineIndex) => (
            <div
              key={`${hunkIndex}-${lineIndex}`}
              className={cn(
                "grid grid-cols-[46px_46px_20px_1fr] items-start",
                LINE_BACKGROUND[line.type],
              )}
            >
              <span className="select-none border-r border-edge/40 px-1.5 py-0.5 text-right text-[10px] text-[#4f637d]">
                {line.oldNumber ?? ""}
              </span>
              <span className="select-none border-r border-edge/40 px-1.5 py-0.5 text-right text-[10px] text-[#4f637d]">
                {line.newNumber ?? ""}
              </span>
              <span
                className={cn(
                  "select-none px-1 py-0.5 text-center",
                  line.type === "add"
                    ? "text-add"
                    : line.type === "del"
                      ? "text-del"
                      : "text-[#3d4d63]",
                )}
              >
                {PREFIX[line.type]}
              </span>
              <span
                className={cn("whitespace-pre px-2 py-0.5", LINE_TEXT[line.type])}
              >
                {line.content || " "}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface SplitRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

function buildSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.type === "normal") {
      rows.push({ left: line, right: line });
      index += 1;
      continue;
    }

    if (line.type === "add") {
      rows.push({ left: null, right: line });
      index += 1;
      continue;
    }

    const deletions: DiffLine[] = [];
    while (index < lines.length && lines[index].type === "del") {
      deletions.push(lines[index]);
      index += 1;
    }

    const additions: DiffLine[] = [];
    while (index < lines.length && lines[index].type === "add") {
      additions.push(lines[index]);
      index += 1;
    }

    const count = Math.max(deletions.length, additions.length);
    for (let offset = 0; offset < count; offset += 1) {
      rows.push({
        left: deletions[offset] ?? null,
        right: additions[offset] ?? null,
      });
    }
  }

  return rows;
}

function SplitCell({
  line,
  side,
}: {
  line: DiffLine | null;
  side: "left" | "right";
}) {
  const number = side === "left" ? line?.oldNumber : line?.newNumber;

  return (
    <div
      className={cn(
        "grid grid-cols-[44px_20px_1fr] items-start",
        line ? LINE_BACKGROUND[line.type] : "bg-[#0a1018]",
      )}
    >
      <span className="select-none border-r border-edge/40 px-1.5 py-0.5 text-right text-[10px] text-[#4f637d]">
        {number ?? ""}
      </span>
      <span
        className={cn(
          "select-none px-1 py-0.5 text-center",
          line?.type === "add"
            ? "text-add"
            : line?.type === "del"
              ? "text-del"
              : "text-[#3d4d63]",
        )}
      >
        {line ? PREFIX[line.type] : ""}
      </span>
      <span
        className={cn(
          "whitespace-pre px-2 py-0.5",
          line ? LINE_TEXT[line.type] : "text-transparent",
        )}
      >
        {line?.content || (line ? " " : "\u00a0")}
      </span>
    </div>
  );
}

function SplitFile({ file }: { file: DiffFile }) {
  return (
    <div className="min-w-[760px] font-mono text-[11px] leading-[1.65]">
      {file.hunks.map((hunk, hunkIndex) => {
        const rows = buildSplitRows(hunk.lines);
        return (
          <div key={`${hunk.header}-${hunkIndex}`}>
            <div className="border-y border-[#233246] bg-[#0c1826] px-3 py-1 text-[10.5px] text-[#78a9e8]">
              {hunk.header}
            </div>
            {rows.map((row, rowIndex) => (
              <div
                key={`${hunkIndex}-${rowIndex}`}
                className="grid grid-cols-2 divide-x divide-edge/50"
              >
                <SplitCell line={row.left} side="left" />
                <SplitCell line={row.right} side="right" />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function DiffViewer({ detail }: DiffViewerProps) {
  const [mode, setMode] = useState<DiffMode>("unified");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const totalAdditions = useMemo(
    () => detail.files.reduce((total, file) => total + file.additions, 0),
    [detail.files],
  );
  const totalDeletions = useMemo(
    () => detail.files.reduce((total, file) => total + file.deletions, 0),
    [detail.files],
  );

  const toggleFile = (path: string): void => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge bg-panel/80 px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
          <span>
            <span className="font-mono text-ink">{detail.files.length}</span> files
          </span>
          <span className="text-[#3e5068]">|</span>
          <span className="font-mono text-add">+{totalAdditions}</span>
          <span className="font-mono text-del">-{totalDeletions}</span>
          <span className="text-[#3e5068]">|</span>
          <span className="font-mono text-[#8fb6ed]">{detail.shortSha}</span>
        </div>

        <div className="flex items-center rounded-md border border-edge bg-canvas p-0.5">
          <button
            type="button"
            onClick={() => setMode("unified")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] transition",
              mode === "unified"
                ? "bg-raised text-ink"
                : "text-muted hover:text-ink",
            )}
            aria-pressed={mode === "unified"}
          >
            <Rows3 className="h-3 w-3" aria-hidden="true" />
            Unified
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] transition",
              mode === "split" ? "bg-raised text-ink" : "text-muted hover:text-ink",
            )}
            aria-pressed={mode === "split"}
          >
            <Columns2 className="h-3 w-3" aria-hidden="true" />
            Split
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {detail.files.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center px-6">
            <div className="text-center">
              <TriangleAlert className="mx-auto h-5 w-5 text-muted" aria-hidden="true" />
              <p className="mt-2 text-[12.5px] text-muted">
                GitHub did not return file changes for this commit.
              </p>
            </div>
          </div>
        ) : null}

        {detail.files.map((file) => {
          const isCollapsed = collapsed.has(file.path);

          return (
            <section key={file.path} className="border-b border-edge">
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-edge/60 bg-[#0d141e]/95 px-2 py-1.5 backdrop-blur sm:px-3">
                <button
                  type="button"
                  onClick={() => toggleFile(file.path)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted" aria-hidden="true" />
                  )}
                  <FileIcon />
                  <span className="truncate font-mono text-[11px] text-[#c9d8eb]">
                    {file.path}
                  </span>
                  {file.oldPath && file.oldPath !== file.path ? (
                    <span className="hidden truncate font-mono text-[9.5px] text-[#61748d] sm:inline">
                      from {file.oldPath}
                    </span>
                  ) : null}
                </button>

                <span className="shrink-0 font-mono text-[10px]">
                  <span className="text-add">+{file.additions}</span>{" "}
                  <span className="text-del">-{file.deletions}</span>
                </span>

                <CopyButton
                  label="Copy file at this commit"
                  getText={() =>
                    fetchRawFile(file.path, detail.sha).then((payload) => payload.raw)
                  }
                  toastTitle={`${file.path} copied at ${detail.shortSha}`}
                  variant="ghost"
                  size="xs"
                  className="hidden sm:inline-flex"
                />
              </div>

              {isCollapsed ? null : file.hunks.length > 0 ? (
                <div className="overflow-x-auto">
                  {mode === "unified" ? (
                    <UnifiedFile file={file} />
                  ) : (
                    <SplitFile file={file} />
                  )}
                </div>
              ) : (
                <div className="px-4 py-5 text-[11.5px] text-muted">
                  Binary file or no textual hunks. Use “Copy file at this commit” to
                  retrieve the historical blob.
                </div>
              )}

              {isCollapsed ? null : (
                <div className="flex justify-end border-t border-edge/40 px-2 py-1 sm:hidden">
                  <CopyButton
                    label="Copy file at this commit"
                    getText={() =>
                      fetchRawFile(file.path, detail.sha).then((payload) => payload.raw)
                    }
                    toastTitle={`${file.path} copied at ${detail.shortSha}`}
                    variant="ghost"
                    size="xs"
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
