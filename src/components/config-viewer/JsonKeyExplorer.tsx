"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CopyButton } from "@/components/ui/CopyButton";
import type { JsonEntry } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface JsonKeyExplorerProps {
  entries: JsonEntry[];
}

const KIND_STYLES: Record<JsonEntry["kind"], string> = {
  string: "border-[#3a5f8f] bg-[#0f1d30] text-[#8dc2ff]",
  number: "border-[#5b4a2a] bg-[#211a0e] text-[#f2c879]",
  boolean: "border-[#3d5c45] bg-[#0d1d14] text-[#88deb0]",
  null: "border-edge bg-raised text-muted",
  array: "border-[#4a3a63] bg-[#181123] text-[#c9a5ff]",
  object: "border-[#4a3a63] bg-[#181123] text-[#c9a5ff]",
};

export function JsonKeyExplorer({ entries }: JsonKeyExplorerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return entries;
    }
    return entries.filter(
      (entry) =>
        entry.key.toLowerCase().includes(normalized) ||
        entry.valuePreview.toLowerCase().includes(normalized),
    );
  }, [entries, query]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter keys, e.g. font, formatOnSave, terminal..."
            className="h-9 w-full rounded-md border border-edge bg-canvas/80 pl-9 pr-3 text-[12px] text-ink placeholder:text-[#5f7188] focus:border-accent/50 focus:outline-none"
            aria-label="Filter JSON keys"
          />
        </label>

        <p className="text-[11px] text-muted">
          <span className="font-mono text-ink">{filtered.length}</span> of{" "}
          <span className="font-mono">{entries.length}</span> keys
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-edge bg-raised/30 px-6 py-12 text-center">
          <p className="text-[13px] text-muted">No keys match your filter.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-2 text-[11.5px] text-accent hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-edge/70 overflow-hidden rounded-lg border border-edge bg-panel/60">
          {filtered.map((entry) => (
            <li
              key={entry.key}
              className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-raised/60 sm:px-4"
            >
              <span
                className={cn(
                  "hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide sm:inline",
                  KIND_STYLES[entry.kind],
                )}
              >
                {entry.kind}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] text-ink">{entry.key}</p>
                <p
                  className="mt-0.5 truncate font-mono text-[10.5px] text-[#71859f]"
                  title={entry.valuePreview}
                >
                  {entry.valuePreview}
                </p>
              </div>

              <CopyButton
                label="Copy key"
                text={entry.copyText}
                toastTitle={`Copied ${entry.key}`}
                variant="ghost"
                size="xs"
                iconOnly
                className="opacity-50 transition-opacity group-hover:opacity-100"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
