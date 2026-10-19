# Product Requirements Document (PRD): VSCode Config & AI Rules Hub

| Metadata | Details |
| :--- | :--- |
| **Project Name** | VSCode Config & AI Rules Hub |
| **Source Repository** | `https://github.com/EvanescenT07/vscode-config` |
| **Document Status** | Approved / Ready for Engineering |
| **Target Architecture** | Full-Stack Next.js (App Router) + Node.js Backend Runtime |
| **Primary Goal** | Centralize IDE configurations, AI Agent rules, and Git repository history for instant discovery, 1-click copying, and diff inspection. |

---

## 1. Executive Summary & Objectives

### 1.1 Problem Statement
Developers and AI-assisted engineers frequently work across multiple machines, workspaces, and environments. Navigating directly through GitHub's web UI to copy `settings.json`, extract specific keybindings, combine modular AI agent prompts, or inspect historical config changes requires too many clicks and lacks specialized developer ergonomics (such as JSONC key filtering or multi-prompt concatenation).

### 1.2 Product Vision
Build a fast, VS Code-themed web application powered by **Next.js** and a **Node.js backend data pipeline** that automatically syncs with `EvanescenT07/vscode-config`. The platform dynamically detects and categorizes repository files into **IDE Configs** and **AI Agent Rules**, providing 1-click clipboard operations and an interactive **Commit History & Diff Inspector**.

### 1.3 Key Objectives
1. **Zero-Maintenance Sync**: Use dynamic file tree auto-detection so new configs or AI rules pushed to `EvanescenT07/vscode-config` appear automatically without code changes.
2. **Instant Clipboard Ergonomics**: Enable 1-click full-file copy, granular JSON setting copy, and multi-file AI rule concatenation.
3. **Resilient Backend Data Pipeline**: Leverage a Node.js backend layer in Next.js to proxy GitHub API requests, authenticate securely with a server-side token (5,000 req/hr), parse JSONC/diffs on the server, and cache responses via Incremental Static Regeneration (ISR) or on-demand webhooks.

---

## 2. System Architecture (Next.js + Node.js Pipeline)

```
+-----------------------------------------------------------------------+
|                        CLIENT (Next.js React FE)                      |
|  +-----------------+  +--------------------+  +--------------------+  |
|  | IDE Config View |  | AI Agent Rules Hub |  | Commit & Diff View |  |
|  +-----------------+  +--------------------+  +--------------------+  |
|           |                     |                       |             |
|           +---------------------+-----------------------+             |
|                                 | (Internal JSON / RSC Payloads)      |
+---------------------------------|-------------------------------------+
                                  v
+-----------------------------------------------------------------------+
|                   BACKEND (Next.js Node.js Runtime)                   |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |                    Node.js Data Pipeline                        |  |
|  |  1. Auto-Discovery & Heuristics Classifier (Tree -> Categories) |  |
|  |  2. JSONC AST Parser (Strips comments, indexes keys for search) |  |
|  |  3. Markdown Frontmatter & Prompt Sanitizer                     |  |
|  |  4. Unified Git Patch Parser (Raw patch -> Structured Diff JSON)|  |
|  +-----------------------------------------------------------------+  |
|                                 |                                     |
|  +-----------------------------------------------------------------+  |
|  |       Server Cache Layer (Next.js Data Cache / ISR / Redis)     |  |
|  +-----------------------------------------------------------------+  |
|                                 |                                     |
+---------------------------------|-------------------------------------+
                                  v (Server-side GITHUB_TOKEN: 5,000 req/hr)
+-----------------------------------------------------------------------+
|              EXTERNAL SOURCE: GitHub REST API v3 & Raw CDN            |
|          Repo: https://github.com/EvanescenT07/vscode-config          |
+-----------------------------------------------------------------------+
```

### 2.1 Technology Stack
* **Framework**: Next.js 15+ (App Router, React Server Components + Client Components)
* **Backend Runtime**: Node.js 20+ LTS (configured via `export const runtime = 'nodejs'` in Route Handlers and Server Actions)
* **Language**: TypeScript 5.x
* **Styling & UI**: Tailwind CSS, Shadcn UI, `lucide-react` (icons)
* **Backend Data Processing Libraries**:
  * `octokit` (`@octokit/rest`): Official GitHub API client for Node.js
  * `jsonc-parser`: Microsoft's fault-tolerant parser for VS Code `settings.json` and `keybindings.json` (handles comments and trailing commas)
  * `parse-diff`: Node utility to convert raw Git unified patches into structured line-by-line JSON objects
  * `shiki`: Server-side syntax highlighter using exact VS Code TextMate grammars and themes

---

## 3. Dynamic Auto-Detection & Categorization Pipeline

Because the repository structure can evolve at any time, the Node.js backend pipeline fetches the recursive Git tree (`GET /repos/EvanescenT07/vscode-config/git/trees/{default_branch}?recursive=1`) and classifies every file (`type === "blob"`) using deterministic heuristics evaluated in priority order:

| Category | Matching Heuristics (Path / Filename / Extension) | Target UI Workspace |
| :--- | :--- | :--- |
| **AI Agent Rules** | - Path matches `/^(rules\|prompts\|agents\|skills\|cursor\|copilot\|claude\|windsurf)\//i`<br>- Filename matches `/(\.cursorrules\|copilot-instructions\.md\|CLAUDE\.md\|GEMINI\.md\|AGENTS\.md\|*rules*\.md\|*prompt*\.md)$/i`<br>- Markdown/text files inside AI-designated directories | **AI Rules Hub** |
| **IDE Configs** | - Path matches `/^(\.vscode\|vscode\|config\|settings\|snippets\|profiles)\//i`<br>- Filename matches `/(settings\.json\|keybindings\.json\|extensions\.json\|tasks\.json\|launch\.json)$/i`<br>- Extensions: `*.code-snippets`, `*.code-profile`, `*.json`, `*.jsonc`, `*.yaml`, `*.yml`, `*.toml`, `.editorconfig`, `.prettierrc*`, `.eslintrc*` | **IDE Configs** |
| **Scripts & Automation** | - Extensions: `*.sh`, `*.ps1`, `*.bat`, `*.zsh`, `Makefile`, `Dockerfile` | **IDE Configs (Scripts Sub-group)** |
| **Documentation & Meta** | - `README.md`, `LICENSE`, `CHANGELOG.md`, `.gitignore`, or unclassified root files | **Overview / Repo Docs** |

*Note: Ignored paths (e.g., `.git/`, `.DS_Store`, `node_modules/`, binary assets like `.png`/`.ico`) are filtered out by the Node.js pipeline before reaching the frontend.*

---

## 4. Core Functional Requirements

### 4.1 Feature 1: IDE Config Viewer & Granular Copy Engine
* **FR-1.1 Full Config Copy**: Every file view features a sticky header with a primary `[Copy Full Config]` button that copies the exact raw text (preserving comments) and triggers a visual toast notification.
* **FR-1.2 Strip-Comments Copy Option**: Dropdown toggle next to the copy button allowing the user to copy either **Raw JSONC (with comments)** or **Strict JSON (comments stripped via Node.js `jsonc-parser`)** for tools that reject comments.
* **FR-1.3 Interactive JSON Key Explorer**:
  * For `settings.json`, `keybindings.json`, and `extensions.json`, the Node.js pipeline parses the AST into individual key-value entries.
  * Users can switch from "Raw File View" to "Key Explorer View" to filter settings by keyword (e.g., `font`, `formatOnSave`, `terminal`) and copy individual JSON key-value lines with one click.
* **FR-1.4 Quick Install Snippet (Extensions)**: If `extensions.json` or an extension list is detected, auto-generate a 1-click copyable CLI command:
  `code --install-extension pub.ext1 --install-extension pub.ext2`

### 4.2 Feature 2: AI Agent Rules Hub
* **FR-2.1 Dual Rendering Mode**: Users can toggle each AI rule file between:
  * **Rendered Markdown View**: Clean typography, tables, and code blocks for human reading.
  * **Raw System Prompt View**: Monospace raw Markdown source ready for LLM/Agent injection.
* **FR-2.2 1-Click Rule Copy**: Instant copy button on both the card overview and detail view.
* **FR-2.3 Multi-Rule Prompt Builder (Combiner)**:
  * Users can check multiple rule files across folders (e.g., `base-coding-rules.md` + `nextjs-rules.md` + `typescript-strict.md`).
  * A floating bottom action bar displays: `3 Rules Selected (Est. ~1,420 tokens) -> [Copy Combined Prompt]`.
  * Clicking copies all selected rules concatenated with clear Markdown delimiters (`\n\n---\n<!-- Source: {filepath} -->\n\n`).
* **FR-2.4 Token Count Estimation**: The Node.js pipeline calculates an approximate token count ($\text{chars} / 4$ or via `gpt-tokenizer`) for every AI rule file and displays it as a badge.

### 4.3 Feature 3: Repository Change History & Diff Inspector
* **FR-3.1 Global & Per-File Commit Timeline**:
  * **Global History Tab**: Chronological feed of commits made to `EvanescenT07/vscode-config`.
  * **Contextual File History Drawer**: Clicking `[History]` while viewing any IDE config or AI rule filters the commit timeline to only commits that modified that specific file (`?path={filepath}`).
* **FR-3.2 Commit Metadata Display**: Each commit entry shows the short SHA (7 chars), commit title/body, author avatar and username, relative timestamp (`3 days ago` + exact UTC tooltip), and stats badge (`+24 / -8`).
* **FR-3.3 Structured Diff Viewer**:
  * Clicking a commit loads the parsed diff from the Node.js pipeline.
  * Supports **Unified View** and **Split (Side-by-Side) View** with syntax-highlighted additions (green) and deletions (red).
* **FR-3.4 Historical Version Copy ("Time Travel")**:
  * Inside the diff viewer, each modified file includes a `[Copy File at this Commit]` button.
  * Fetches the exact blob at that historical commit SHA (`raw.githubusercontent.com/EvanescenT07/vscode-config/{sha}/{filepath}`) so the user can easily roll back a broken setting or restore an older AI prompt.

### 4.4 Feature 4: Global Command Palette (`Cmd/Ctrl + K`)
* **FR-4.1 Instant Search Modal**: Keyboard-first navigation palette allowing instant fuzzy search across:
  1. All auto-detected file names and paths.
  2. Individual JSON keys inside `settings.json`.
  3. AI Rule section headings.
  4. Direct actions (`Copy settings.json`, `View Latest Commit`).

---

## 5. Backend Data Pipeline & API Specification (Next.js Node.js Runtime)

All external communication with GitHub is handled by Next.js Server Route Handlers (`app/api/...`) or Server Actions running on the **Node.js runtime**.

### 5.1 Backend API Endpoints

#### `GET /api/repo/tree`
* **Purpose**: Fetches the repository branch metadata and recursive Git tree, runs the auto-detection classifier, and returns the categorized navigation tree.
* **Upstream GitHub Call**: `GET /repos/EvanescenT07/vscode-config/git/trees/{default_branch}?recursive=1`
* **Pipeline Processing**: Filters blobs, categorizes into `ideConfigs`, `aiRules`, `scripts`, and `docs`, computes file sizes.
* **Caching**: `next: { revalidate: 300, tags: ['repo-tree'] }` (5-minute ISR cache + instant purge via webhook).

#### `GET /api/repo/file?path={filepath}&ref={branch_or_sha}`
* **Purpose**: Fetches raw file content and performs content-aware server parsing.
* **Upstream Call**: `GET https://raw.githubusercontent.com/EvanescenT07/vscode-config/{ref}/{filepath}`
* **Pipeline Processing**:
  * Generates Shiki syntax-highlighted HTML on the server (zero client-side JS bundle weight for highlighting).
  * If JSON/JSONC: Parses key-value pairs via `jsonc-parser` and generates a clean JSON string alongside raw text.
  * If Markdown/AI Rule: Calculates estimated token count and extracts headings.
* **Caching**: Cached by `{ref}:{filepath}`. If `ref` is an immutable commit SHA, cached indefinitely (`Cache-Control: public, max-age=31536000, immutable`).

#### `GET /api/repo/commits?path={optional_filepath}&page={1}&per_page={30}`
* **Purpose**: Retrieves commit history globally or for a specific file.
* **Upstream GitHub Call**: `GET /repos/EvanescenT07/vscode-config/commits`
* **Pipeline Processing**: Normalizes commit author info, message title vs. body, and pagination cursors.
* **Caching**: `next: { revalidate: 120, tags: ['repo-commits'] }`.

#### `GET /api/repo/commits/[sha]`
* **Purpose**: Fetches detailed commit statistics and unified diff patches for a specific commit SHA.
* **Upstream GitHub Call**: `GET /repos/EvanescenT07/vscode-config/commits/{sha}`
* **Pipeline Processing**: Uses `parse-diff` in Node.js to transform raw Git `patch` strings into structured hunks and lines (`type: 'add' | 'del' | 'normal'`, `oldLineNumber`, `newLineNumber`, `content`).
* **Caching**: Immutable cache (`revalidate: false`), since a Git commit SHA payload never changes.

#### `POST /api/webhooks/github` (Optional Enhancement)
* **Purpose**: Receives `push` events from `EvanescenT07/vscode-config`.
* **Pipeline Processing**: Verifies `X-Hub-Signature-256` using Node `crypto.timingSafeEqual`, then triggers `revalidateTag('repo-tree')` and `revalidateTag('repo-commits')` for instant zero-latency updates when changes are pushed.

---

## 6. UI / UX Specification

### 6.1 Layout Architecture (VS Code Inspired Workbench)
```
+-----------------------------------------------------------------------------------+
| [Activity] | [Sidebar Explorer]      | [Breadcrumb: IDE Configs > settings.json]  |
|            |                         | [Search Keys...] [Raw|Explorer] [Copy All] |
|  [ { } ]   | v IDE CONFIGS           +--------------------------------------------+
|   IDE      |   - settings.json       |  1 | {                                     |
|            |   - keybindings.json    |  2 |   // Editor configuration             |
|  [ AI ]    |   - extensions.json     |  3 |   "editor.fontSize": 14,       [Copy] |
|   Rules    | v AI AGENT RULES        |  4 |   "editor.tabSize": 2,         [Copy] |
|            |   [x] cursorrules       |  5 |   "files.autoSave": "afterDelay"      |
|  [ Git ]   |   [x] claude-prompt.md  |  6 | }                                     |
|  History   | v DOCS                  |                                            |
|            |   - README.md           +--------------------------------------------+
|  [Cmd+K]   |                         | [Drawer: File Commit History (4 commits)]  |
+-----------------------------------------------------------------------------------+
| [main] | Last Sync: 2m ago (SHA: a1b2c3d) | API Status: Healthy | UTF-8 | JSONC   |
+-----------------------------------------------------------------------------------+
```

### 6.2 Core User Flows
1. **Copying an IDE Config**:
   * User opens site -> Default view loads primary IDE config (e.g., `settings.json`) -> Clicks `[Copy All]` -> Toast confirms copy in $<50\text{ ms}$.
2. **Combining & Copying AI Rules**:
   * User switches to `AI Rules` tab -> Checks boxes next to desired rule files -> Clicks `[Copy Combined Prompt]` in floating bar -> Pastes directly into Cursor/Claude/Copilot.
3. **Inspecting Changes & Rolling Back**:
   * User clicks `History` icon in activity bar (or `[History]` button inside a file) -> Selects a commit from timeline -> Inspects green/red diff lines -> Clicks `[Copy File at this Commit]` to grab the previous working config.

---

## 7. Non-Functional Requirements (NFRs) & Security

### 7.1 Performance & Reliability
* **Server Response Time (Cached)**: $< 100\text{ ms}$ Time to First Byte (TTFB) via Next.js Server Cache.
* **Server Response Time (Cold GitHub Fetch)**: $< 800\text{ ms}$ including Node.js AST/diff parsing.
* **Graceful Degradation**: If the `GITHUB_TOKEN` environment variable is omitted in local development, the Node.js pipeline automatically falls back to unauthenticated GitHub requests (60 req/hr) + Raw CDN fetching with aggressive ISR caching.

### 7.2 Security Requirements
* **Server-Only Token Isolation**: `GITHUB_TOKEN` must **never** be prefixed with `NEXT_PUBLIC_`. It is accessed strictly inside Node.js server modules (`import 'server-only'`).
* **Least-Privilege GitHub PAT**: If using a Fine-Grained Personal Access Token on the backend, it requires **Read-Only** access to `Contents` and `Metadata` for `EvanescenT07/vscode-config` only.
* **Path Traversal Prevention**: The `/api/repo/file` endpoint must sanitize and validate the `path` query parameter against the known Git tree list to prevent SSRF or arbitrary URL fetching.

---

## 8. Environment Variables & Project Structure

### 8.1 Required `.env.local` Configuration
```ini
# Target Repository Configuration
GITHUB_OWNER="EvanescenT07"
GITHUB_REPO="vscode-config"
GITHUB_DEFAULT_BRANCH="main" # Auto-detected if omitted

# Optional but Recommended: Fine-Grained Read-Only GitHub Token (Raises limit from 60 to 5,000 req/hr)
GITHUB_TOKEN="github_pat_xxxxxxxxxxxxxxxxxxxxxxxxx"

# Optional: Secret for GitHub Push Webhook instant cache invalidation
GITHUB_WEBHOOK_SECRET="your_webhook_secret_here"
```

### 8.2 Recommended Next.js Directory Structure
```text
src/
├── app/
│   ├── api/
│   │   ├── repo/
│   │   │   ├── tree/route.ts          # Node.js auto-detection tree pipeline
│   │   │   ├── file/route.ts          # Node.js file fetcher + JSONC/Shiki parser
│   │   │   └── commits/
│   │   │       ├── route.ts           # Commit history list endpoint
│   │   │       └── [sha]/route.ts     # Single commit unified diff parser
│   │   └── webhooks/
│   │       └── github/route.ts        # On-demand ISR cache invalidation
│   ├── layout.tsx                     # VS Code workbench shell & Cmd+K provider
│   ├── page.tsx                       # Main dashboard (RSC initial data load)
│   └── history/
│       └── page.tsx                   # Dedicated global commit & diff inspector view
├── lib/
│   ├── server/
│   │   ├── github-client.ts           # Server-only Octokit + fetch wrapper
│   │   ├── classifier.ts              # Dynamic file auto-detection heuristics
│   │   ├── jsonc-pipeline.ts          # JSONC AST key extractor & comment stripper
│   │   └── diff-pipeline.ts           # Unified patch to JSON converter
│   └── utils/
│       └── clipboard.ts               # Client copy helpers & multi-rule combiner
└── components/
    ├── workbench/                     # Sidebar, Activity Bar, Status Bar
    ├── config-viewer/                 # Code viewer, JSON Key Explorer, Copy actions
    ├── ai-rules/                      # Rule cards, Markdown toggle, Prompt Combiner
    └── history-diff/                  # Commit timeline, Split/Unified diff viewer
```

---

## 9. Phased Delivery Roadmap

* **Phase 1: Core Node.js Data Pipeline & Auto-Detection (Days 1–2)**
  * Set up Next.js App Router project with TypeScript and Tailwind CSS.
  * Implement `github-client.ts` and `classifier.ts` to dynamically fetch and categorize `EvanescenT07/vscode-config`.
  * Build `/api/repo/tree` and `/api/repo/file` with server-side Shiki highlighting and `jsonc-parser`.
* **Phase 2: IDE Configs & AI Rules Hub UI (Days 3–4)**
  * Build the VS Code-style workbench layout, sidebar file tree, and status bar.
  * Implement 1-click copy, Strip-Comments JSON copy, and the interactive JSON Key Explorer.
  * Build the AI Agent Rules viewer with Raw/Rendered toggle and the Multi-Rule Prompt Combiner.
* **Phase 3: Commit History & Diff Inspector (Days 5–6)**
  * Implement `/api/repo/commits` and `/api/repo/commits/[sha]` using `parse-diff`.
  * Build the Global Commit Timeline, Per-File History Drawer, Unified/Split Diff Viewer, and "Copy File at this Commit" time-travel button.
* **Phase 4: Command Palette & Deployment (Day 7)**
  * Add `Cmd/Ctrl + K` search palette across files, JSON keys, and rules.
  * Deploy to Vercel (or Node.js container host) and configure `GITHUB_TOKEN` + optional GitHub Push Webhook.