import "server-only";

import { getNodeValue, parse, parseTree } from "jsonc-parser";
import type { Node } from "jsonc-parser";

import type { JsonEntry, MarkdownHeading } from "@/lib/types";

function kindOf(node: Node): JsonEntry["kind"] {
  switch (node.type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array":
      return "array";
    default:
      return "object";
  }
}

function preview(value: unknown): string {
  const serialized = JSON.stringify(value) ?? "null";
  return serialized.length > 140 ? `${serialized.slice(0, 137)}...` : serialized;
}

export function extractJsonEntries(raw: string): JsonEntry[] {
  const errors: import("jsonc-parser").ParseError[] = [];
  const root = parseTree(raw, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (!root) {
    return [];
  }

  const entries: JsonEntry[] = [];

  const walk = (node: Node, path: string[]): void => {
    if (node.type === "object") {
      for (const property of node.children ?? []) {
        const keyNode = property.children?.[0];
        const valueNode = property.children?.[1];
        if (!keyNode || !valueNode || typeof keyNode.value !== "string") {
          continue;
        }

        const nextPath = [...path, keyNode.value];

        if (valueNode.type === "object") {
          walk(valueNode, nextPath);
          continue;
        }

        const value = getNodeValue(valueNode);
        const dottedKey = nextPath.join(".");

        entries.push({
          key: dottedKey,
          copyText: `${JSON.stringify(dottedKey)}: ${JSON.stringify(value)}`,
          valuePreview: preview(value),
          kind: kindOf(valueNode),
        });
      }
      return;
    }

    if (node.type === "array") {
      for (const item of node.children ?? []) {
        if (item.type === "object") {
          walk(item, path);
        }
      }
    }
  };

  walk(root, []);

  return entries;
}

export function stripJsonComments(raw: string): string | null {
  const errors: import("jsonc-parser").ParseError[] = [];
  const value = parse(raw, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (value === undefined) {
    return null;
  }

  return JSON.stringify(value, null, 2);
}

export function extractMarkdownHeadings(raw: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const lines = raw.split(/\r?\n/);
  const headingPattern = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
  const seen = new Map<string, number>();

  for (const line of lines) {
    const match = headingPattern.exec(line);
    if (!match) {
      continue;
    }

    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[`*_~]/g, "")
      .trim();

    if (!text) {
      continue;
    }

    const baseSlug =
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-") || "section";

    const occurrence = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, occurrence + 1);
    const slug = occurrence === 0 ? baseSlug : `${baseSlug}-${occurrence}`;

    headings.push({ depth: match[1].length, text, slug });
  }

  return headings;
}

export function estimateTokens(raw: string): number {
  return Math.max(1, Math.ceil(raw.length / 4));
}

const EXTENSION_ID = /^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i;

function collectFromValue(value: unknown, target: Set<string>): void {
  if (typeof value === "string") {
    if (EXTENSION_ID.test(value.trim())) {
      target.add(value.trim());
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectFromValue(item, target);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectFromValue(item, target);
    }
  }
}

export function buildExtensionInstallCommand(
  path: string,
  raw: string,
  isJson: boolean,
): string | null {
  if (!/extensions?/i.test(path)) {
    return null;
  }

  const ids = new Set<string>();

  if (isJson) {
    const value = parse(raw, [], {
      allowTrailingComma: true,
      disallowComments: false,
    });
    collectFromValue(value, ids);
  } else {
    for (const line of raw.split(/\r?\n/)) {
      const candidate = line.trim().replace(/^[-*+]\s+/, "");
      if (candidate && !candidate.startsWith("#") && EXTENSION_ID.test(candidate)) {
        ids.add(candidate);
      }
    }
  }

  if (ids.size === 0) {
    return null;
  }

  return `code ${[...ids].map((id) => `--install-extension ${id}`).join(" ")}`;
}
