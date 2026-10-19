import "server-only";

import parseDiff from "parse-diff";

import type { DiffFile, DiffHunk, DiffLine } from "@/lib/types";

function cleanPath(value: string | undefined): string {
  if (!value || value === "/dev/null") {
    return "";
  }
  return value.replace(/^[ab]\//, "").replace(/^\//, "");
}

function isNoNewlineMarker(content: string): boolean {
  return content.startsWith("\\ No newline");
}

function stripMarker(content: string): string {
  if (content.startsWith("+") || content.startsWith("-") || content.startsWith(" ")) {
    return content.slice(1);
  }
  return content;
}

export function parseUnifiedDiff(raw: string): DiffFile[] {
  if (!raw.trim()) {
    return [];
  }

  const parsed = parseDiff(raw);

  return parsed.map((file) => {
    const hunks: DiffHunk[] = file.chunks.map((chunk, chunkIndex) => {
      let oldNumber = chunk.oldStart;
      let newNumber = chunk.newStart;
      const lines: DiffLine[] = [];

      if (chunkIndex === 0 && chunk.content && !chunk.content.startsWith("@@")) {
        lines.push({
          type: "normal",
          oldNumber: null,
          newNumber: null,
          content: chunk.content,
        });
      }

      for (const change of chunk.changes) {
        if (isNoNewlineMarker(change.content)) {
          lines.push({
            type: "normal",
            oldNumber: null,
            newNumber: null,
            content: change.content,
          });
          continue;
        }

        if (change.type === "del" || change.del) {
          lines.push({
            type: "del",
            oldNumber,
            newNumber: null,
            content: stripMarker(change.content),
          });
          oldNumber += 1;
          continue;
        }

        if (change.type === "add" || change.add) {
          lines.push({
            type: "add",
            oldNumber: null,
            newNumber,
            content: stripMarker(change.content),
          });
          newNumber += 1;
          continue;
        }

        lines.push({
          type: "normal",
          oldNumber,
          newNumber,
          content: stripMarker(change.content),
        });
        oldNumber += 1;
        newNumber += 1;
      }

      return {
        header:
          chunk.content ||
          `@@ -${chunk.oldStart},${chunk.oldLines} +${chunk.newStart},${chunk.newLines} @@`,
        lines,
      };
    });

    const additions = hunks.reduce(
      (total, hunk) => total + hunk.lines.filter((line) => line.type === "add").length,
      0,
    );
    const deletions = hunks.reduce(
      (total, hunk) => total + hunk.lines.filter((line) => line.type === "del").length,
      0,
    );

    return {
      path: cleanPath(file.to) || cleanPath(file.from),
      oldPath: cleanPath(file.from),
      additions: typeof file.additions === "number" ? file.additions : additions,
      deletions: typeof file.deletions === "number" ? file.deletions : deletions,
      hunks,
    };
  });
}
