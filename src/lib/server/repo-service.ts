import "server-only";

import {
  GitHubApiError,
  getCommitDetails,
  getCommitPage,
  getDefaultBranch,
  getRateLimit,
  getRawFile,
  getRecursiveTree,
  getRepoCoordinates,
  isCommitSha,
} from "@/lib/server/github-client";
import {
  classifyBlob,
  languageFor,
} from "@/lib/server/classifier";
import {
  buildExtensionInstallCommand,
  estimateTokens,
  extractJsonEntries,
  extractMarkdownHeadings,
  stripJsonComments,
} from "@/lib/server/jsonc-pipeline";
import { parseUnifiedDiff } from "@/lib/server/diff-pipeline";
import { highlightCode } from "@/lib/server/highlight";
import type {
  CommitDetail,
  CommitListResponse,
  CommitSummary,
  FilePayload,
  RawFilePayload,
  RepoFile,
  RepoTree,
  SearchIndex,
} from "@/lib/types";
import type {
  GitHubCommitDetailResponse,
  GitHubCommitListItem,
  GitHubCommitFile,
} from "@/lib/server/github-client";

export class RequestValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RequestValidationError";
    this.status = status;
  }
}

function normalizeRepoPath(input: string): string {
  const path = input.replace(/\\/g, "/").trim();

  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\u0000") ||
    path.includes("..") ||
    path.split("/").some((segment) => segment === "" || segment === ".")
  ) {
    throw new RequestValidationError("Invalid repository path.");
  }

  return path;
}

function normalizeRef(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  const ref = input.trim();
  if (!/^[A-Za-z0-9._/-]+$/.test(ref) || ref.includes("..")) {
    throw new RequestValidationError("Invalid Git reference.");
  }

  return ref;
}

function toCommitSummary(item: GitHubCommitListItem): CommitSummary {
  const message = item.commit.message ?? "";
  const [title, ...rest] = message.split(/\r?\n/);
  const body = rest.join("\n").trim();
  const date =
    item.commit.author?.date ??
    item.commit.committer?.date ??
    new Date(0).toISOString();

  return {
    sha: item.sha,
    shortSha: item.sha.slice(0, 7),
    title: title?.trim() || "Untitled commit",
    body,
    author: {
      name: item.commit.author?.name ?? item.author?.login ?? "Unknown author",
      login: item.author?.login ?? null,
      avatarUrl: item.author?.avatar_url ?? null,
    },
    date,
    url: item.html_url,
    additions: item.stats?.additions,
    deletions: item.stats?.deletions,
  };
}

function buildUnifiedPatch(file: GitHubCommitFile): string | null {
  if (!file.patch) {
    return null;
  }

  const oldPath = file.previous_filename ?? file.filename;
  return [
    `diff --git a/${oldPath} b/${file.filename}`,
    `--- a/${oldPath}`,
    `+++ b/${file.filename}`,
    file.patch,
  ].join("\n");
}

function normalizeCommitDetail(item: GitHubCommitDetailResponse): CommitDetail {
  const summary = toCommitSummary(item);
  const rawPatch = (item.files ?? [])
    .map(buildUnifiedPatch)
    .filter((patch): patch is string => Boolean(patch))
    .join("\n");

  const parsedFiles = parseUnifiedDiff(rawPatch);
  const parsedByPath = new Map(parsedFiles.map((file) => [file.path, file]));

  const files = (item.files ?? []).map((file) => {
    const parsed = parsedByPath.get(file.filename);

    return {
      path: file.filename,
      oldPath: file.previous_filename ?? parsed?.oldPath ?? file.filename,
      additions: file.additions,
      deletions: file.deletions,
      hunks: parsed?.hunks ?? [],
    };
  });

  return {
    ...summary,
    stats: item.stats ?? {
      additions: files.reduce((total, file) => total + file.additions, 0),
      deletions: files.reduce((total, file) => total + file.deletions, 0),
      total: files.length,
    },
    files,
  };
}

export async function getRepoTree(): Promise<RepoTree> {
  const { owner, repo } = getRepoCoordinates();
  const branch = await getDefaultBranch();
  const [tree, latestCommits] = await Promise.all([
    getRecursiveTree(branch),
    getCommitPage({ perPage: 1 }),
  ]);

  const files: RepoFile[] = tree.tree
    .map(classifyBlob)
    .filter((file): file is RepoFile => file !== null)
    .sort((left, right) => left.path.localeCompare(right.path));

  const latest = latestCommits[0];

  return {
    owner,
    repo,
    branch,
    latestSha: latest?.sha ?? "",
    latestCommitTitle: latest?.commit.message.split(/\r?\n/)[0] ?? "",
    latestCommitDate:
      latest?.commit.author?.date ??
      latest?.commit.committer?.date ??
      new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    files,
    rateLimit: getRateLimit(),
  };
}

async function assertPathAccessible(path: string, ref: string): Promise<void> {
  if (isCommitSha(ref)) {
    const detail = await getCommitDetails(ref);
    const known = (detail.files ?? []).some((file) => file.filename === path);

    if (!known) {
      throw new RequestValidationError(
        `File "${path}" is not part of commit "${ref}".`,
        404,
      );
    }
    return;
  }

  const tree = await getRecursiveTree(ref);
  const known = tree.tree.some((entry) => entry.type === "blob" && entry.path === path);

  if (!known) {
    throw new RequestValidationError(
      `File "${path}" does not exist at "${ref}".`,
      404,
    );
  }
}

async function resolveRef(ref: string | null): Promise<string> {
  return ref ?? (await getDefaultBranch());
}

export async function getRawFileContent(
  requestedPath: string,
  requestedRef?: string | null,
): Promise<RawFilePayload> {
  const path = normalizeRepoPath(requestedPath);
  const ref = await resolveRef(normalizeRef(requestedRef));

  await assertPathAccessible(path, ref);
  const raw = await getRawFile(path, ref);

  return { path, ref, raw };
}

export async function getFilePayload(
  requestedPath: string,
  requestedRef?: string | null,
): Promise<FilePayload> {
  const path = normalizeRepoPath(requestedPath);
  const ref = await resolveRef(normalizeRef(requestedRef));

  await assertPathAccessible(path, ref);
  const raw = await getRawFile(path, ref);
  const language = languageFor(path);
  const isJson = /\.(json|jsonc)$/i.test(path);
  const isMarkdown = /\.(md|mdx|mdc)$/i.test(path);
  const isAiRuleCandidate =
    isMarkdown || /\.(txt|mdc)$/i.test(path) || /(^|\/)(rules|prompts|agents|skills)\//i.test(path);

  const [highlightedHtml] = await Promise.all([highlightCode(raw, language)]);

  return {
    path,
    ref,
    raw,
    language,
    highlightedHtml,
    strippedJson: isJson ? stripJsonComments(raw) : null,
    jsonEntries: isJson ? extractJsonEntries(raw) : [],
    tokenEstimate: isAiRuleCandidate || isMarkdown ? estimateTokens(raw) : null,
    headings: isMarkdown ? extractMarkdownHeadings(raw) : [],
    extensionCli: buildExtensionInstallCommand(path, raw, isJson),
    size: Buffer.byteLength(raw, "utf8"),
  };
}

export async function getCommitList(options: {
  path?: string | null;
  page?: number;
  perPage?: number;
}): Promise<CommitListResponse> {
  const page = Math.max(options.page ?? 1, 1);
  const perPage = Math.min(Math.max(options.perPage ?? 30, 1), 100);
  const path = options.path ? normalizeRepoPath(options.path) : undefined;
  const commits = await getCommitPage({ path, page, perPage });

  return {
    commits: commits.map(toCommitSummary),
    page,
    perPage,
    hasMore: commits.length === perPage,
  };
}

export async function getCommitDetail(sha: string): Promise<CommitDetail> {
  if (!isCommitSha(sha)) {
    throw new RequestValidationError("Invalid commit SHA.");
  }

  const detail = await getCommitDetails(sha);
  return normalizeCommitDetail(detail);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const run = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => run());
  await Promise.all(workers);

  return results;
}

export async function getSearchIndex(): Promise<SearchIndex> {
  const tree = await getRepoTree();
  const candidates = tree.files
    .filter(
      (file) =>
        (file.isJson || file.isMarkdown || file.category === "aiRules") &&
        file.size <= 250_000,
    )
    .slice(0, 80);

  const jsonKeys: SearchIndex["jsonKeys"] = [];
  const headings: SearchIndex["headings"] = [];
  const tokenEstimates: Record<string, number> = {};

  await mapWithConcurrency(candidates, 6, async (file) => {
    try {
      const raw = await getRawFile(file.path, tree.branch);

      if (file.isJson) {
        for (const entry of extractJsonEntries(raw)) {
          jsonKeys.push({
            path: file.path,
            key: entry.key,
            copyText: entry.copyText,
            valuePreview: entry.valuePreview,
          });
        }
      }

      if (file.isMarkdown) {
        for (const heading of extractMarkdownHeadings(raw)) {
          headings.push({
            path: file.path,
            text: heading.text,
            depth: heading.depth,
            slug: heading.slug,
          });
        }
      }

      if (file.category === "aiRules" || file.isMarkdown) {
        tokenEstimates[file.path] = estimateTokens(raw);
      }
    } catch (error) {
      if (error instanceof GitHubApiError && error.status !== 429) {
        return;
      }
      throw error;
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    jsonKeys,
    headings,
    tokenEstimates,
  };
}
