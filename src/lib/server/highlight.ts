import "server-only";

import { createHash } from "node:crypto";

import { createHighlighter } from "shiki";
import type { Highlighter } from "shiki";

const SUPPORTED_LANGUAGES = [
  "jsonc",
  "markdown",
  "typescript",
  "javascript",
  "yaml",
  "toml",
  "shellscript",
  "powershell",
  "bat",
  "ini",
  "text",
];

const MAX_HIGHLIGHT_LENGTH = 300_000;
const CACHE_LIMIT = 160;

const htmlCache = new Map<string, string>();

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["dark-plus"],
      langs: SUPPORTED_LANGUAGES,
    });
  }
  return highlighterPromise;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function remember(key: string, html: string): string {
  if (htmlCache.size >= CACHE_LIMIT) {
    const oldest = htmlCache.keys().next().value;
    if (oldest) {
      htmlCache.delete(oldest);
    }
  }
  htmlCache.set(key, html);
  return html;
}

export async function highlightCode(code: string, language: string): Promise<string> {
  const cacheKey = createHash("sha1")
    .update(language)
    .update("\u0000")
    .update(code)
    .digest("hex");

  const cached = htmlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (code.length > MAX_HIGHLIGHT_LENGTH) {
    return remember(
      cacheKey,
      `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`,
    );
  }

  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : "text";
  const highlighter = await getHighlighter();
  const html = highlighter.codeToHtml(code, {
    lang,
    theme: "dark-plus",
  });

  return remember(cacheKey, html);
}
