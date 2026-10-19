"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Square,
  Terminal,
  X,
} from "lucide-react";

import { FileTypeIcon } from "@/components/workbench/FileTypeIcon";
import type { FileCategory, RepoFile } from "@/lib/types";
import { CATEGORY_ORDER } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface ExplorerProps {
  files: RepoFile[];
  selectedPath: string | null;
  selectedRulePaths: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleRule: (path: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onClose?: () => void;
}

interface FolderNode {
  name: string;
  path: string;
  folders: FolderNode[];
  files: RepoFile[];
}

const SECTION_META: Record<
  FileCategory,
  { label: string; Icon: typeof Settings2; accent: string }
> = {
  ideConfigs: { label: "IDE Configs", Icon: Settings2, accent: "text-[#f0c674]" },
  aiRules: { label: "AI Agent Rules", Icon: Sparkles, accent: "text-[#c9a5ff]" },
  scripts: { label: "Scripts & Automation", Icon: Terminal, accent: "text-[#7ee0b0]" },
  docs: { label: "Documentation", Icon: BookOpen, accent: "text-[#7fb4ff]" },
};

function buildTree(files: RepoFile[]): FolderNode {
  const root: FolderNode = { name: "", path: "", folders: [], files: [] };

  for (const file of files) {
    const segments = file.path.split("/");
    let node = root;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      const path = segments.slice(0, index + 1).join("/");
      let child = node.folders.find((folder) => folder.name === segment);

      if (!child) {
        child = { name: segment, path, folders: [], files: [] };
        node.folders.push(child);
      }

      node = child;
    }

    node.files.push(file);
  }

  const sortNode = (node: FolderNode): void => {
    node.folders.sort((left, right) => left.name.localeCompare(right.name));
    node.files.sort((left, right) => left.name.localeCompare(right.name));
    node.folders.forEach(sortNode);
  };

  sortNode(root);
  return root;
}

interface FileRowProps {
  file: RepoFile;
  depth: number;
  active: boolean;
  ruleSelected: boolean;
  onSelectFile: (path: string) => void;
  onToggleRule: (path: string) => void;
}

function FileRow({
  file,
  depth,
  active,
  ruleSelected,
  onSelectFile,
  onToggleRule,
}: FileRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center rounded-sm pr-2 transition-colors",
        active ? "bg-accent-soft/80" : "hover:bg-raised/80",
      )}
      style={{ paddingLeft: 10 + depth * 12 }}
    >
      {file.category === "aiRules" ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleRule(file.path);
          }}
          className={cn(
            "mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition hover:text-ink",
            ruleSelected ? "text-accent opacity-100" : "opacity-40 group-hover:opacity-100",
          )}
          aria-label={ruleSelected ? `Deselect ${file.name}` : `Select ${file.name}`}
          aria-pressed={ruleSelected}
        >
          {ruleSelected ? (
            <CheckSquare2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      ) : (
        <span className="w-5" />
      )}

      <button
        type="button"
        onClick={() => onSelectFile(file.path)}
        title={file.path}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 py-[5px] text-left text-[12px]",
          active ? "text-ink" : "text-muted group-hover:text-ink",
        )}
      >
        <FileTypeIcon file={file} />
        <span className="truncate">{file.name}</span>
      </button>
    </div>
  );
}

interface FolderRowsProps {
  node: FolderNode;
  depth: number;
  collapsed: Set<string>;
  onToggleFolder: (path: string) => void;
  selectedPath: string | null;
  selectedRulePaths: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleRule: (path: string) => void;
}

function FolderRows({
  node,
  depth,
  collapsed,
  onToggleFolder,
  selectedPath,
  selectedRulePaths,
  onSelectFile,
  onToggleRule,
}: FolderRowsProps) {
  return (
    <>
      {node.folders.map((folder) => {
        const isCollapsed = collapsed.has(folder.path);
        return (
          <div key={folder.path}>
            <button
              type="button"
              onClick={() => onToggleFolder(folder.path)}
              className="group flex w-full items-center gap-1.5 rounded-sm py-[5px] text-left text-[12px] text-muted transition-colors hover:bg-raised/80 hover:text-ink"
              style={{ paddingLeft: 10 + depth * 12 }}
              title={folder.path}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
              )}
              {isCollapsed ? (
                <Folder className="h-3.5 w-3.5 shrink-0 text-[#7b8ba3]" aria-hidden="true" />
              ) : (
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#8fa4c2]" aria-hidden="true" />
              )}
              <span className="truncate">{folder.name}</span>
            </button>
            {isCollapsed ? null : (
              <FolderRows
                node={folder}
                depth={depth + 1}
                collapsed={collapsed}
                onToggleFolder={onToggleFolder}
                selectedPath={selectedPath}
                selectedRulePaths={selectedRulePaths}
                onSelectFile={onSelectFile}
                onToggleRule={onToggleRule}
              />
            )}
          </div>
        );
      })}

      {node.files.map((file) => (
        <FileRow
          key={file.path}
          file={file}
          depth={depth}
          active={selectedPath === file.path}
          ruleSelected={selectedRulePaths.has(file.path)}
          onSelectFile={onSelectFile}
          onToggleRule={onToggleRule}
        />
      ))}
    </>
  );
}

export function Explorer({
  files,
  selectedPath,
  selectedRulePaths,
  onSelectFile,
  onToggleRule,
  onRefresh,
  refreshing,
  onClose,
}: ExplorerProps) {
  const [query, setQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<FileCategory>>(
    new Set(),
  );
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return files;
    }
    return files.filter((file) => file.path.toLowerCase().includes(normalized));
  }, [files, query]);

  const groups = useMemo(() => {
    const map = new Map<FileCategory, RepoFile[]>();
    for (const category of CATEGORY_ORDER) {
      map.set(category, []);
    }
    for (const file of filteredFiles) {
      map.get(file.category)?.push(file);
    }
    return map;
  }, [filteredFiles]);

  const toggleSection = (category: FileCategory): void => {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleFolder = (path: string): void => {
    setCollapsedFolders((current) => {
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
    <aside className="flex h-full w-full flex-col border-r border-edge bg-panel/70">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Explorer
          </span>
          <span className="rounded-full border border-edge bg-raised px-1.5 py-0.5 text-[9.5px] font-medium text-muted">
            {files.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh repository tree"
            aria-label="Refresh repository tree"
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3 w-3", refreshing && "animate-spin")}
              aria-hidden="true"
            />
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              title="Close explorer"
              aria-label="Close explorer"
              className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink md:hidden"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-2.5 pb-2">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter files..."
            className="h-7 w-full rounded border border-edge bg-canvas/80 pl-7 pr-2 text-[11.5px] text-ink placeholder:text-[#5f7188] focus:border-accent/50 focus:outline-none"
            aria-label="Filter repository files"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {CATEGORY_ORDER.map((category) => {
          const categoryFiles = groups.get(category) ?? [];
          if (categoryFiles.length === 0) {
            return null;
          }

          const meta = SECTION_META[category];
          const isCollapsed = query.trim() ? false : collapsedSections.has(category);
          const tree = buildTree(categoryFiles);
          const Icon = meta.Icon;

          return (
            <section key={category} className="mb-1">
              <button
                type="button"
                onClick={() => toggleSection(category)}
                className="group flex w-full items-center gap-1.5 px-2 py-1.5 text-left transition-colors hover:bg-raised/60"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3 text-muted" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted" aria-hidden="true" />
                )}
                <Icon className={cn("h-3.5 w-3.5", meta.accent)} aria-hidden="true" />
                <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#aab8cc]">
                  {meta.label}
                </span>
                <span className="rounded bg-raised px-1.5 py-0.5 text-[9.5px] text-muted">
                  {categoryFiles.length}
                </span>
              </button>

              {isCollapsed ? null : (
                <FolderRows
                  node={tree}
                  depth={0}
                  collapsed={query.trim() ? new Set() : collapsedFolders}
                  onToggleFolder={toggleFolder}
                  selectedPath={selectedPath}
                  selectedRulePaths={selectedRulePaths}
                  onSelectFile={onSelectFile}
                  onToggleRule={onToggleRule}
                />
              )}
            </section>
          );
        })}

        {filteredFiles.length === 0 ? (
          <div className="mx-3 mt-4 rounded-lg border border-dashed border-edge bg-raised/30 px-3 py-5 text-center">
            <p className="text-[12px] text-muted">No files match “{query}”.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 text-[11px] text-accent hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-edge px-3 py-2.5">
        <p className="text-[10px] leading-4 text-[#61748d]">
          Auto-detected from the Git tree. New configs and rules appear after a
          refresh.
        </p>
      </div>
    </aside>
  );
}
