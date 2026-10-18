# Antigravity Settings & Configurations Export

> **Export Date:** 2026-10-16  
> **Source Machine User:** `zulfi`  
> **Environment:** Windows  
> **Active Workspace:** `D:\Documents\Fikar\.Project\hr-system-mobile`  
> **Primary Downloads Folder:** `D:\Download`

---

## Table of Contents

1. [Global Instructions & Rules (`GEMINI.md`)](#1-global-instructions--rules-geminimd)
2. [Global Application Configuration (`config.json`)](#2-global-application-configuration-configjson)
3. [Model Context Protocol (MCP) Configuration (`mcp_config.json`)](#3-model-context-protocol-mcp-configuration-mcp_configjson)
4. [Global Skills Pointer (`skills.json`)](#4-global-skills-pointer-skillsjson)
5. [Installed Skills Registry (`.skill-lock.json`)](#5-installed-skills-registry-skill-lockjson)
6. [Antigravity IDE User Settings (`settings.json`)](#6-antigravity-ide-user-settings-settingsjson)
7. [Workspace Project Customizations (`.agents/`)](#7-workspace-project-customizations-agents)
   - [Workspace Rule: `graphify.md`](#workspace-rule-graphifymd)
   - [Workspace Workflow: `graphify.md`](#workspace-workflow-graphifymd)
   - [Workspace Skills Config: `skills.json`](#workspace-skills-config-skillsjson)
8. [Registered Antigravity Project Profiles](#8-registered-antigravity-project-profiles)
   - [`hr-system-mobile`](#project-hr-system-mobile)
   - [`portfolio-project`](#project-portfolio-project)
   - [`caffchat`](#project-caffchat)
9. [Antigravity State Metadata (`antigravity_state.pbtxt`)](#9-antigravity-state-metadata-antigravity_statepbtxt)

---

## 1. Global Instructions & Rules (`GEMINI.md`)

**File Location:** `C:\Users\zulfi\.gemini\GEMINI.md`

```markdown
# Engineering Guidelines & Pair Programming Rules

## 1. Code Modification & Presentation

### Do Not Directly Modify Files

- Do **not** directly modify repository code files unless explicitly instructed by the user.
- Instead, present code suggestions, refactoring plans, and diffs with clear explanations so the developer maintains full control over codebase edits.

### Autonomous & Auto-Allowed Read-Only Actions

All non-destructive requests, read-only commands, and repository inspection actions are **auto-approved**. Execute them freely, immediately, and autonomously without waiting or asking for user confirmation:

- **Filesystem & Directory Inspection:** `list_dir`, `view_file`, `grep_search`, `Get-ChildItem` (`dir`, `ls`), `Get-Content` (`cat`, `type`), `Test-Path`, `Select-String`, directory tree traversal.
- **Version Control Inspection:** `git status`, `git log`, `git diff`, `git show`, `git branch` (listing), `git tag` (listing), `git remote -v`, `git rev-parse`, `git blame`.
- **Project & Static Analysis Inspection:** Reading configuration files (`pubspec.yaml`, `analysis_options.yaml`, `.env.dev`, `swagger/`, `package.json`), running read-only analyzers (e.g., `flutter analyze --no-fatal-infos`, `dart analyze`), checking lint logs, or reviewing test outputs.
- **Documentation & Research:** Querying Context7 MCP tools (`resolve-library-id`, `query-docs`) and reading local documentation or specifications.

### Strict Permission Required for Mutating & Destructive Actions

For any action that modifies system, repository, or environment state, the agent **must halt and request explicit user confirmation** before proceeding:

- **Repository Modifications:** Writing, modifying, or deleting project files (`write_to_file`, `replace_file_content`, `Remove-Item`, `del`, `rm`, `Move-Item`).
- **State-Altering Git Operations:** `git commit`, `git push`, `git reset`, `git checkout -f`, `git switch`, `git clean`, `git rebase`, `git merge`, `git branch -d/-D`, `git stash drop`.
- **External Scripts & Mutating Environment Changes:** Executing unverified external scripts, installing global tools, or running package commands that alter lockfiles (e.g., `flutter pub upgrade`, `npm install <pkg>`).

### Explain All Provided Code

- Accompany every code proposal with a clear explanation of its design rationale, architectural trade-offs, and implementation details.
- Clarify why specific patterns, types, or abstractions were chosen over simpler or alternate approaches.

### Explicit File Names and Paths

- Always explicitly provide the full relative and/or absolute file path for every file that needs to be modified, created, or deleted (e.g., `lib/features/auth/presentation/login_screen.dart`).
- Ensure the developer can easily locate, review, and apply the suggested changes in their IDE.

---

## 2. Senior Pair Programming & Critical Evaluation

### Act as a Senior Pair Programmer

- Act as a pragmatic, highly experienced senior engineer and tech lead.
- Do **not** blindly agree with the user's prompts, assumptions, or requested architectural choices.

### Provide Constructive Criticism

- Critically evaluate requested patterns, library selections, and design structures against industry standards and domain best practices.
- Point out potential edge cases, scalability bottlenecks, security vulnerabilities, performance traps, and technical debt early.

### Propose Better Alternatives & Decide Together

- If a request violates architectural guidelines or if a cleaner, more idiomatic approach exists:
  1. Highlight the reasoning and trade-offs of the user's initial proposal.
  2. Propose the superior alternative with clear technical justification (e.g., Clean Architecture, separation of concerns, testability).
  3. Frame the comparison constructively so we can decide together before writing code.

---

## 3. Legacy Code Optimization Process

### Preserve Existing Behavior & Backward Compatibility

- Never introduce breaking changes or regress established business behavior when touching legacy code.
- Ensure existing public API contracts, return types, and side-effects remain stable unless explicitly planned for deprecation.

### The Three-Step Optimization Process

Follow this strict sequence when refactoring:

1. **Make it Readable:**
   - Standardize formatting, eliminate dead code, and clarify ambiguous intent.
   - Rename cryptic variable, method, and class names to self-documenting English identifiers.
   - Extract large, complex methods into cohesive private helper functions without altering business logic.
2. **Make it Maintainable:**
   - Modularize monolithic components and strictly eliminate duplicate code (DRY).
   - Isolate side-effects, decouple business logic from UI/framework dependencies, and introduce dependency inversion.
   - Establish unit, widget, or integration test coverage around critical paths to guard against regressions.
3. **Make it Flexible:**
   - Introduce design patterns, polymorphic interfaces, or configurable abstractions **only when** business requirements demand variability or extension (YAGNI).
   - Avoid premature abstraction layers that add cognitive load without tangible benefit.

---

## 4. Software Design Principles & Code Quality

### Core Principles

- Strictly adhere to **SOLID**, **KISS** (Keep It Simple, Stupid), **YAGNI** (You Aren't Gonna Need It), and **DRY** (Don't Repeat Yourself).
- Favor composition over inheritance. Favor immutable data structures over mutable state.

### Avoid STUPID Anti-Patterns

Actively avoid and eliminate the STUPID anti-patterns:

- **S**ingleton Abuse: Avoid global state that hides dependencies and creates tight coupling.
- **T**ight Coupling: Components must not rely on the internal implementation details of other modules.
- **U**ntestability: Avoid code with hardcoded dependencies, hidden static calls, or side-effects in constructors.
- **P**remature Optimization: Do not sacrifice readability or simplicity for unmeasured micro-optimizations.
- **I**ndescriptive Naming: Eliminate abbreviations, single-letter variables (except standard loop indices), and ambiguous identifiers.
- **D**uplication: Never copy-paste logic across screens, controllers, or repositories.

### Descriptive English Naming Conventions

- Use intention-revealing, domain-accurate English naming for all classes, methods, variables, files, and directories.
- Name booleans with interrogative prefixes (e.g., `isLoading`, `hasPermission`, `canSubmit`).
- Avoid vague suffixes like `Manager`, `Helper`, or `Data` when more precise domain terminology exists (e.g., `AuthSessionCoordinator`, `TokenStorageService`).

### Readability Over Premature Optimization

- Prioritize clean, readable, expressive, and maintainable code over clever, compressed, or unreadable one-liners.
- Write self-documenting code; use comments to explain the **why**, not the **what**.

### Strict Language Formatting & Style Guides

- Strictly adhere to language-specific style guides, lint configurations, and formatting rules:
  - **Dart/Flutter:** Adhere to `dart format`, official Dart style rules (`effective_dart`), and rules configured in `analysis_options.yaml` (e.g., prefer `const`, avoid late initialization unless necessary, typed collections).
  - **Other Languages:** Follow PEP 8 (Python), Prettier/ESLint (JavaScript/TypeScript), or appropriate ecosystem standards.

---

## 5. Robust Error & Exception Handling

### Never Catch Generic Exceptions

- Never catch generic top-level types like `Exception`, `Error`, or `Throwable`.
- Catch narrow, highly specific exception types (e.g., in Dart/Flutter: `on DioException catch (e, stackTrace)`, `on SocketException catch (e, stackTrace)`, `on FormatException catch (e, stackTrace)`).

### Mandatory Structured Logging & Visibility

- Route all caught exceptions through designated logging frameworks (e.g., `Logger`, structured logger) with adequate context, error messages, and full stack traces.
- Do not rely on silent or bare `print()` statements in production code.

### Never Swallow Errors

- Never leave empty `catch` blocks or ignore exceptions (`catch (_) {}`).
- Never return `null`, fallback defaults, or empty collections to silently mask critical errors without logging and proper error propagation.
- Gracefully map low-level exceptions into domain-level failures/results (e.g., `Failure` models or `Result<T>` types) that the UI layer can handle informatively.

---

## 6. Language & Localization

### Exclusively English Source Code

- Write all source code, variable names, function names, classes, interfaces, enums, comments, docstrings, and commit/log messages exclusively in English.
- User-facing UI strings must be decoupled into localization files (e.g., `.arb` files or localization bundles) rather than hardcoded in source files.

---

## 7. Context7 MCP Documentation Integration

### Proactive Documentation Retrieval

- Proactively leverage the **Context7 MCP** server (`resolve-library-id`, `query-docs`) whenever library/API documentation, third-party package usage, code generation, framework configuration, or setup steps are needed.
- Do **not** wait for explicit user prompts to look up documentation. Retrieve official package docs, correct method signatures, and breaking changes prior to generating code to prevent hallucinated or deprecated APIs.

---

## 8. Anti-Slop Quality Gate for Code Snippets & Artifacts

### Mandatory Anti-Slop Filtering for Code & UI Proposals

- Always apply the **Anti-Slop plugin** (`antislop`, `antislop-code`, `antislop-ui`, `antislop-copywriting`) standards whenever presenting code snippets, diffs, architectural walkthroughs, or artifact documents.
- Actively filter out AI slop patterns from all generated code:
  - **Zero Filler Comments (`antislop-code`):** Strictly eliminate redundant comments that state the obvious or restate language syntax (e.g., `// initialize variable`, `// build method`, `// return result`). Comments must only exist to clarify non-obvious business logic, domain invariants, or subtle edge cases (*why*, never *what*).
  - **No Generic AI Boilerplate or Artificial Placeholders:** Avoid cookie-cutter scaffolding, lazy placeholder data (`foo`, `test1`, `example text`), and ungrounded abstractions. Ensure all snippets feel crafted by a senior developer and directly grounded in the project's domain.
  - **Liveliness & Quality Locks (`antislop-ui`):** When presenting UI components, reject generic templates, monotonous cards, and poor contrast. Ensure typography, spacing hierarchy, and touch/interaction feedback feel intentional and designed.
```

---

## 2. Global Application Configuration (`config.json`)

**File Location:** `C:\Users\zulfi\.gemini\config\config.json`

```json
{
  "plugins": {
    "android-cli-plugin": {
      "enabled": true
    },
    "firebase": {
      "enabled": true
    },
    "antislop": {
      "enabled": true
    }
  },
  "userSettings": {
    "globalPermissionGrants": {
      "allow": [
        "command(Get-ChildItem)",
        "read_file(D:\\Documents\\Fikar\\Project\\portfoliov3\\prisma\\schema.prisma)",
        "read_file(D:\\Documents\\Fikar\\Project\\portfoliov3\\types\\data-types.ts)",
        "read_file(D:\\Documents\\Fikar\\Project\\portfoliov3\\app\\admin\\(dashboard)\\media\\page.tsx)",
        "command(git diff)"
      ]
    },
    "remoteControlHostname": "aliansyah-distant-photon"
  }
}
```

---

## 3. Model Context Protocol (MCP) Configuration (`mcp_config.json`)

**File Location:** `C:\Users\zulfi\.gemini\config\mcp_config.json`  
*(Also mirrored at `C:\Users\zulfi\.gemini\antigravity\mcp_config.json`)*

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx.cmd",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest",
        "--api-key",
        "ctx7sk-998ca8bb-92ea-474b-afc2-d3a617443a6d"
      ]
    },
    "graphify": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "graphifyy",
        "--with",
        "mcp",
        "python",
        "-m",
        "graphify.serve"
      ]
    },
    "dart-mcp-server": {
      "$typeName": "exa.cascade_plugins_pb.CascadePluginCommandTemplate",
      "command": "dart",
      "args": ["mcp-server"],
      "env": {}
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Alternative HTTP-Based Context7 Configuration (IDE specific)
**File Location:** `C:\Users\zulfi\.gemini\antigravity-ide\mcp_config.json`

```json
{
  "mcpServers": {
    "context7": {
      "serverUrl": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "ctx7sk-bbec1db6-edb2-4761-9705-6bb53b6ce379"
      }
    }
  }
}
```

---

## 4. Global Skills Pointer (`skills.json`)

**File Location:** `C:\Users\zulfi\.gemini\config\skills.json`

```json
{"entries":[{"path":"C:/Users/zulfi/.agents/skills"}]}
```

---

## 5. Installed Skills Registry (`.skill-lock.json`)

**File Location:** `C:\Users\zulfi\.agents\.skill-lock.json`

```json
{
  "version": 3,
  "skills": {
    "find-skills": {
      "source": "vercel-labs/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/vercel-labs/skills.git",
      "skillPath": "skills/find-skills/SKILL.md",
      "skillFolderHash": "3013fdeb8a11b10b1eb795ec3ae8bfca38f7c26d",
      "installedAt": "2026-05-15T06:41:39.730Z",
      "updatedAt": "2026-05-15T06:41:39.730Z"
    },
    "pptx": {
      "source": "anthropics/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/anthropics/skills.git",
      "skillPath": "skills/pptx/SKILL.md",
      "skillFolderHash": "64529c8b3f35fe632b7256bd2f6d46e4b40160ce",
      "pluginName": "document-skills",
      "installedAt": "2026-07-28T02:41:21.971Z",
      "updatedAt": "2026-07-28T02:41:51.851Z"
    },
    "pdf": {
      "source": "anthropics/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/anthropics/skills.git",
      "skillPath": "skills/pdf/SKILL.md",
      "skillFolderHash": "6369f4649de69bd6857c9bc3b058a77206009238",
      "pluginName": "document-skills",
      "installedAt": "2026-07-28T02:41:59.404Z",
      "updatedAt": "2026-07-28T02:41:59.404Z"
    },
    "webapp-testing": {
      "source": "anthropics/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/anthropics/skills.git",
      "skillPath": "skills/webapp-testing/SKILL.md",
      "skillFolderHash": "5ffb7dc66b9fd4c25c3e400a4c00da99a349b714",
      "pluginName": "example-skills",
      "installedAt": "2026-07-28T02:42:05.904Z",
      "updatedAt": "2026-07-28T02:42:05.904Z"
    },
    "xlsx": {
      "source": "anthropics/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/anthropics/skills.git",
      "skillPath": "skills/xlsx/SKILL.md",
      "skillFolderHash": "fe6471cc9b5b97aae0b576ccb92ffd9b0207589d",
      "pluginName": "document-skills",
      "installedAt": "2026-07-28T02:42:12.443Z",
      "updatedAt": "2026-07-28T02:42:12.443Z"
    },
    "android-native-dev": {
      "source": "MiniMax-AI/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/MiniMax-AI/skills.git",
      "skillPath": "skills/android-native-dev/SKILL.md",
      "skillFolderHash": "cdaadb554c6d5e7d65f35f5052e81c3d839ebdd2",
      "installedAt": "2026-07-28T02:42:20.240Z",
      "updatedAt": "2026-07-28T02:42:20.240Z"
    },
    "firebase-auth-basics": {
      "source": "firebase/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/firebase/skills.git",
      "skillPath": "skills/firebase-auth-basics/SKILL.md",
      "skillFolderHash": "1a98891948b7c7fd64f17b1141e1ed359ddde191",
      "installedAt": "2026-07-28T02:43:16.703Z",
      "updatedAt": "2026-07-28T02:43:16.703Z"
    },
    "flutter-build-responsive-layout": {
      "source": "flutter/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/flutter/skills.git",
      "skillPath": "skills/flutter-build-responsive-layout/SKILL.md",
      "skillFolderHash": "018c3c52c14b46fe242ef0b1336a7b07d5d860be",
      "installedAt": "2026-07-28T02:44:05.465Z",
      "updatedAt": "2026-07-28T02:44:05.465Z"
    },
    "flutter-implement-json-serialization": {
      "source": "flutter/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/flutter/skills.git",
      "skillPath": "skills/flutter-implement-json-serialization/SKILL.md",
      "skillFolderHash": "8c117bee0dd986449f4d636b86221a7f9485a222",
      "installedAt": "2026-07-28T02:44:10.977Z",
      "updatedAt": "2026-07-28T02:44:10.977Z"
    },
    "flutter-use-http-package": {
      "source": "flutter/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/flutter/skills.git",
      "skillPath": "skills/flutter-use-http-package/SKILL.md",
      "skillFolderHash": "bd169b5cee731751f3b32f43c94cfe9495fc8e6c3eb621b785c69e38b77d0e19",
      "installedAt": "2026-07-28T02:44:17.385Z",
      "updatedAt": "2026-07-28T02:44:39.952Z"
    },
    "flutter-setup-declarative-routing": {
      "source": "flutter/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/flutter/skills.git",
      "skillPath": "skills/flutter-setup-declarative-routing/SKILL.md",
      "skillFolderHash": "4c2ed2fd729230be581b15d84741688e206632fb2b38af320060cd3518b91179",
      "installedAt": "2026-07-28T02:44:24.192Z",
      "updatedAt": "2026-07-28T02:44:44.618Z"
    },
    "flutter-apply-architecture-best-practices": {
      "source": "flutter/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/flutter/skills.git",
      "skillPath": "skills/flutter-apply-architecture-best-practices/SKILL.md",
      "skillFolderHash": "baeb208b1cab90c559677626dbd101b96ba93f803cbed85122abdadeb3283a8b",
      "installedAt": "2026-07-28T02:44:30.836Z",
      "updatedAt": "2026-07-28T02:44:30.836Z"
    },
    "flutter-fix-layout-issues": {
      "source": "flutter/skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/flutter/skills.git",
      "skillPath": "skills/flutter-fix-layout-issues/SKILL.md",
      "skillFolderHash": "b2f9789451224e6df8d1d7ac63854c2f1beb30fa35d13ea06fbae9ba2b1b0a7f",
      "installedAt": "2026-07-28T02:44:37.035Z",
      "updatedAt": "2026-07-28T02:44:37.035Z"
    },
    "auth0": {
      "source": "auth0/agent-skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/auth0/agent-skills.git",
      "skillPath": "plugins/auth0/skills/auth0/SKILL.md",
      "skillFolderHash": "334174cade0d2466e8d880718d0599831b20e9aa68e17a4709abfb5f6d82121d",
      "installedAt": "2026-07-28T02:49:20.588Z",
      "updatedAt": "2026-07-28T02:49:20.588Z"
    },
    "figma-design-to-code": {
      "source": "figma/mcp-server-guide",
      "sourceType": "github",
      "sourceUrl": "https://github.com/figma/mcp-server-guide.git",
      "skillPath": "skills/figma-design-to-code/SKILL.md",
      "skillFolderHash": "9541d22db46ab9071cf03748bb6e5c1b03889addbe4d977c4ccb6d32be7dd4ec",
      "installedAt": "2026-07-28T02:49:25.948Z",
      "updatedAt": "2026-07-28T02:49:25.948Z"
    }
  },
  "dismissed": {
    "findSkillsPrompt": true
  }
}
```

---

## 6. Antigravity IDE User Settings (`settings.json`)

**File Location:** `C:\Users\zulfi\AppData\Roaming\Antigravity IDE\User\settings.json`

```json
{
  "workbench.colorCustomizations": {},
  "workbench.iconTheme": "material-icon-theme",
  "workbench.colorTheme": "Dark Modern",
  "sourcery.token": "user_1_Ss_vX20F7Dt1Fe_9v99tGQsHwDKkW8DkYODMdpq6eiqW3oyuHrt80K5Lk",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "files.autoSave": "afterDelay",
  "javascript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "svg.preview.mode": "img",
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": false,
    "scminput": false,
    "python": true,
    "prisma": false,
    "typescriptreact": true,
  },
  "docker.extension.dockerEngineAvailabilityPrompt": false,
  "python.analysis.typeCheckingMode": "standard",
  "github.copilot.nextEditSuggestions.enabled": true,
  "explorer.confirmDelete": false,
  "git.openRepositoryInParentFolders": "always",
  "[svg]": {
    "editor.defaultFormatter": "jock.svg",
  },
  "[prisma]": {
    "editor.defaultFormatter": "ajmnz.prisma-import",
  },
  "css.lint.unknownAtRules": "ignore",
  "css.lint.unknownProperties": "ignore",
  "[typescriptreact]": {},
  "dart.flutterSdkPath": "D:\\dev\\flutter",
  "java.jdt.ls.java.home": "D:\\android\\jbr",
  "jdk.telemetry.enabled": true,
  "diffEditor.renderSideBySide": false,
  "explorer.confirmPasteNative": false,
}
```

---

## 7. Workspace Project Customizations (`.agents/`)

### Workspace Rule: `graphify.md`
**File Location:** `d:\Documents\Fikar\.Project\hr-system-mobile\.agents\rules\graphify.md`

```markdown
---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI) or `query_graph` (MCP). Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
```

### Workspace Workflow: `graphify.md`
**File Location:** `d:\Documents\Fikar\.Project\hr-system-mobile\.agents\workflows\graphify.md`

```markdown
---
name: graphify
description: Turn any folder of files into a navigable knowledge graph
---

# Workflow: graphify

Follow the graphify skill to run the full pipeline.

If no path argument is given, use `.` (current directory).
```

### Workspace Skills Config: `skills.json`
**File Location:** `d:\Documents\Fikar\.Project\hr-system-mobile\.agents\skills.json`

```json
{
  "entries": [
    { "path": "C:/Users/zulfi/.agents/skills" }
  ]
}
```

---

## 8. Registered Antigravity Project Profiles

### Project: `hr-system-mobile`
**File Location:** `C:\Users\zulfi\.gemini\config\projects\2fa07f98-7596-4512-ac13-f35806c4e6d4.json`

```json
{
  "id": "2fa07f98-7596-4512-ac13-f35806c4e6d4",
  "name": "hr-system-mobile",
  "projectResources": {
    "resources": [
      {
        "gitFolder": {
          "folderUri": "file:///d%3A/Documents/Fikar/.Project/hr-system-mobile",
          "defaultBranch": "dev/phase_3"
        }
      }
    ]
  },
  "updatedAt": "2026-08-13T02:27:00.494850400Z"
}
```

### Project: `portfolio-project`
**File Location:** `C:\Users\zulfi\.gemini\config\projects\69cfc3df-1384-4ee6-9605-65a9addd8f89.json`

```json
{
  "id": "69cfc3df-1384-4ee6-9605-65a9addd8f89",
  "name": "portfolio-project",
  "projectResources": {
    "resources": [
      {
        "gitFolder": {
          "folderUri": "file:///d%3A/Documents/Fikar/Project/portfoliov3",
          "defaultBranch": "development"
        }
      }
    ]
  },
  "environments": {
    "environments": [
      {
        "id": "7b346cd3-f154-4c8b-bdcf-d6e028956335",
        "name": "migrate-local-data-prisma",
        "resources": {
          "resources": [
            {
              "folderUri": "file:///C:/Users/zulfi/.gemini/antigravity/worktrees/portfoliov3/migrate-local-data-prisma"
            }
          ]
        }
      },
      {
        "id": "e40733f8-2df1-4580-91dc-ffc4023b6156",
        "name": "fix-tech-render-experience-slider",
        "resources": {
          "resources": [
            {
              "folderUri": "file:///C:/Users/zulfi/.gemini/antigravity/worktrees/portfoliov3/fix-tech-render-experience-slider"
            }
          ]
        }
      },
      {
        "id": "79e6a185-4507-48c6-8bd9-0b7e57672f45",
        "name": "fix-tech-render-experience-slider-v2",
        "resources": {
          "resources": [
            {
              "folderUri": "file:///C:/Users/zulfi/.gemini/antigravity/worktrees/portfoliov3/fix-tech-render-experience-slider-v2"
            }
          ]
        }
      }
    ]
  },
  "permissionGrants": {
    "permissionGrants": {
      "allow": [
        "command(Get-Content)",
        "command(git status)",
        "command(git branch)",
        "mcp(context7)"
      ]
    }
  },
  "settings": {
    "fileAccessPolicy": "AGENT_SETTING_POLICY_ASK",
    "internetPolicy": "AGENT_SETTING_POLICY_ASK",
    "autoExecutionPolicy": "CASCADE_COMMANDS_AUTO_EXECUTION_OFF",
    "artifactReviewMode": "ARTIFACT_REVIEW_MODE_ALWAYS"
  },
  "updatedAt": "2026-07-02T15:42:36.254208500Z"
}
```

### Project: `caffchat`
**File Location:** `C:\Users\zulfi\.gemini\config\projects\c953f377-240d-4dcf-87c2-c82b335b068f.json`

```json
{
  "id": "c953f377-240d-4dcf-87c2-c82b335b068f",
  "name": "caffchat",
  "projectResources": {
    "resources": [
      {
        "gitFolder": {
          "folderUri": "file:///d%3A/Documents/Fikar/Project/mobile/caffchat",
          "defaultBranch": "development"
        }
      }
    ]
  },
  "environments": {
    "environments": [
      {
        "id": "ac3ade61-1bc0-4cc6-94bf-40da9b8d945b",
        "name": "explain-async-loading-state",
        "resources": {
          "resources": [
            {
              "folderUri": "file:///C:/Users/zulfi/.gemini/antigravity/worktrees/caffchat/explain-async-loading-state"
            }
          ]
        }
      }
    ]
  },
  "permissionGrants": {
    "permissionGrants": {
      "allow": [
        "read_file(D:\\Documents\\Fikar\\Project\\hr-system-mobile\\lib\\core\\lifecycle)",
        "read_file(D:\\Documents\\Fikar\\Project\\hr-system-mobile\\lib)",
        "read_file(D:\\Documents\\Fikar\\Project\\hr-system-mobile\\pubspec.yaml)"
      ]
    }
  },
  "settings": {
    "fileAccessPolicy": "AGENT_SETTING_POLICY_ASK",
    "internetPolicy": "AGENT_SETTING_POLICY_ASK",
    "autoExecutionPolicy": "CASCADE_COMMANDS_AUTO_EXECUTION_OFF",
    "artifactReviewMode": "ARTIFACT_REVIEW_MODE_ALWAYS"
  },
  "updatedAt": "2026-06-22T06:26:51.258536600Z"
}
```

---

## 9. Antigravity State Metadata (`antigravity_state.pbtxt`)

**File Location:** `C:\Users\zulfi\.gemini\antigravity\antigravity_state.pbtxt`

```text
post_onboarding: {
  completed_steps: POST_ONBOARDING_STEP_TYPE_MANAGER_WELCOME
  completed_steps: POST_ONBOARDING_STEP_TYPE_USAGE_MODE
  completed_steps: POST_ONBOARDING_STEP_TYPE_AGENT_CONFIGURATION
  completed_steps: POST_ONBOARDING_STEP_TYPE_ADD_WORKSPACE
}
seen_nuxs: {
  uids: 24
  uids: 23
  uids: 27
  uids: 26
  uids: 25
  uids: 31
  uids: 29
}
agent_onboarding_completed: AGENT_ONBOARDING_STATE_COMPLETED
last_selected_agent_model: MODEL_PLACEHOLDER_M71
migrate_convos_into_projects: MIGRATION_STATUS_COMPLETED
installation_uuid: "a8561d00-50ed-43af-9e77-008ec3486770"
migrate_retroactive_projects: RETROACTIVE_MIGRATION_STATUS_COMPLETED_UNNECESSARY
migrations: {
  key: 2
  value: MIGRATION_STATUS_COMPLETED
}
migrations: {
  key: 3
  value: MIGRATION_STATUS_COMPLETED
}
migrations: {
  key: 4
  value: MIGRATION_STATUS_COMPLETED
}
```
