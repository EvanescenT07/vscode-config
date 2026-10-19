export type FileCategory = "ideConfigs" | "aiRules" | "scripts" | "docs";

export interface RepoFile {
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

export interface RateLimitInfo {
  remaining: number | null;
  limit: number | null;
  resetAt: string | null;
}

export interface RepoTree {
  owner: string;
  repo: string;
  branch: string;
  latestSha: string;
  latestCommitTitle: string;
  latestCommitDate: string;
  generatedAt: string;
  files: RepoFile[];
  rateLimit: RateLimitInfo;
}

export interface JsonEntry {
  key: string;
  copyText: string;
  valuePreview: string;
  kind: "string" | "number" | "boolean" | "null" | "array" | "object";
}

export interface MarkdownHeading {
  depth: number;
  text: string;
  slug: string;
}

export interface FilePayload {
  path: string;
  ref: string;
  raw: string;
  language: string;
  highlightedHtml: string;
  strippedJson: string | null;
  jsonEntries: JsonEntry[];
  tokenEstimate: number | null;
  headings: MarkdownHeading[];
  extensionCli: string | null;
  size: number;
}

export interface RawFilePayload {
  path: string;
  ref: string;
  raw: string;
}

export interface CommitAuthor {
  name: string;
  login: string | null;
  avatarUrl: string | null;
}

export interface CommitSummary {
  sha: string;
  shortSha: string;
  title: string;
  body: string;
  author: CommitAuthor;
  date: string;
  url: string;
  additions?: number;
  deletions?: number;
}

export interface DiffLine {
  type: "add" | "del" | "normal";
  oldNumber: number | null;
  newNumber: number | null;
  content: string;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffFile {
  path: string;
  oldPath: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface CommitDetail extends CommitSummary {
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  files: DiffFile[];
}

export interface CommitListResponse {
  commits: CommitSummary[];
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface SearchIndex {
  generatedAt: string;
  jsonKeys: Array<{ path: string; key: string; copyText: string; valuePreview: string }>;
  headings: Array<{ path: string; text: string; depth: number; slug: string }>;
  tokenEstimates: Record<string, number>;
}

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  ideConfigs: "IDE Configs",
  aiRules: "AI Agent Rules",
  scripts: "Scripts & Automation",
  docs: "Documentation",
};

export const CATEGORY_ORDER: FileCategory[] = ["ideConfigs", "aiRules", "scripts", "docs"];
