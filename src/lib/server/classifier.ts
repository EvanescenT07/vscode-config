import "server-only";

import type { FileCategory } from "@/lib/types";

const AI_DIRECTORY =
  /(^|\/)(rules|prompts|agents|agent|skills|cursor|copilot|claude|windsurf)(\/|$)/i;

const AI_FILENAME =
  /(^|\/)(\.cursorrules|copilot-instructions\.md|CLAUDE\.md|GEMINI\.md|AGENTS\.md|[^/]*rules[^/]*\.md|[^/]*prompt[^/]*\.md)$/i;

const AI_TEXT_EXTENSION = /\.(md|mdx|mdc|txt)$/i;

const SCRIPT_EXTENSION = /\.(sh|ps1|bat|cmd|zsh)$/i;
const SCRIPT_FILENAME = /(^|\/)(Makefile|Dockerfile)$/i;

const DOC_FILENAME =
  /(^|\/)(README|LICENSE|CHANGELOG|CONTRIBUTING|CODE_OF_CONDUCT)(\.[a-z]+)?$/i;

const IDE_FILENAME =
  /(^|\/)(settings\.json|keybindings\.json|extensions\.json|tasks\.json|launch\.json)$/i;

const IDE_DIRECTORY =
  /(^|\/)(\.vscode|vscode|config|settings|snippets|profiles)(\/|$)/i;

const IDE_EXTENSION =
  /\.(json|jsonc|yaml|yml|toml|code-snippets|code-profile)$/i;

const TEXT_DOC_EXTENSION = /\.(md|mdx|txt|pbtxt)$/i;

const EXTENSION_LIST = /extensions?/i;

const IGNORED_PREFIXES = [
  "node_modules/",
  ".next/",
  ".git/",
  ".vercel/",
  "src/",
  "public/",
  "out/",
  "coverage/",
];

const IGNORED_FILES = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "tsconfig.json",
  "tsconfig.tsbuildinfo",
  "next-env.d.ts",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "postcss.config.js",
  ".gitignore",
  ".env",
  ".env.local",
  ".env.example",
]);

const BINARY_EXTENSION =
  /\.(png|jpe?g|gif|webp|avif|ico|icns|pdf|zip|gz|tar|rar|7z|woff2?|ttf|otf|eot|mp3|mp4|mov|webm|wasm|exe|dll|so|dylib)$/i;

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  json: "jsonc",
  jsonc: "jsonc",
  md: "markdown",
  mdx: "markdown",
  mdc: "markdown",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  sh: "shellscript",
  zsh: "shellscript",
  ps1: "powershell",
  bat: "bat",
  cmd: "bat",
  cfg: "ini",
  ini: "ini",
  pbtxt: "ini",
  txt: "text",
};

export interface GitHubTreeBlob {
  path: string;
  type: string;
  size?: number;
}

export interface ClassifiedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  category: FileCategory;
  isJson: boolean;
  isMarkdown: boolean;
  isAiRule: boolean;
  language: string;
}

export function shouldIgnore(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  if (!normalized || normalized.endsWith("/")) {
    return true;
  }

  if (BINARY_EXTENSION.test(normalized)) {
    return true;
  }

  if (IGNORED_FILES.has(normalized)) {
    return true;
  }

  return IGNORED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function extensionOf(path: string): string {
  const filename = path.split("/").pop() ?? path;
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(dotIndex + 1).toLowerCase() : "";
}

export function classifyPath(path: string, size = 0): FileCategory {
  const filename = path.split("/").pop() ?? path;
  const extension = extensionOf(path);
  const isText = AI_TEXT_EXTENSION.test(filename);

  if (/^PRD[\s._-]/i.test(filename)) {
    return "docs";
  }

  if ((AI_DIRECTORY.test(path) && isText) || AI_FILENAME.test(filename)) {
    return "aiRules";
  }

  if (SCRIPT_EXTENSION.test(filename) || SCRIPT_FILENAME.test(filename)) {
    return "scripts";
  }

  if (DOC_FILENAME.test(filename)) {
    return "docs";
  }

  if (IDE_FILENAME.test(filename) || IDE_EXTENSION.test(filename)) {
    return "ideConfigs";
  }

  if (IDE_DIRECTORY.test(path)) {
    return "ideConfigs";
  }

  if (EXTENSION_LIST.test(filename) && /\.txt$/i.test(filename)) {
    return "ideConfigs";
  }

  if (TEXT_DOC_EXTENSION.test(filename)) {
    return "docs";
  }

  return "docs";
}

export function classifyBlob(blob: GitHubTreeBlob): ClassifiedFile | null {
  if (blob.type !== "blob" || shouldIgnore(blob.path)) {
    return null;
  }

  const category = classifyPath(blob.path, blob.size ?? 0);
  const extension = extensionOf(blob.path);
  const name = blob.path.split("/").pop() ?? blob.path;

  return {
    path: blob.path,
    name,
    extension,
    size: blob.size ?? 0,
    category,
    isJson: extension === "json" || extension === "jsonc",
    isMarkdown: extension === "md" || extension === "mdx" || extension === "mdc",
    isAiRule: category === "aiRules",
    language: languageFor(blob.path),
  };
}

export function languageFor(path: string): string {
  return LANGUAGE_BY_EXTENSION[extensionOf(path)] ?? "text";
}

export function isAiRulePath(path: string): boolean {
  return classifyPath(path) === "aiRules";
}
