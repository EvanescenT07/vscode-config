# Antigravity IDE & VS Code Configuration Kit

A comprehensive development environment configuration, extension suite, and AI agent customization kit designed to provide seamless parity between **Visual Studio Code** and **Google Antigravity IDE**.

---

## Overview

This repository serves as a centralized source of truth for:
- **Editor Settings (`settings.json`)**: Pre-configured for full-stack, mobile (Flutter/Dart), Python, and modern web development with optimized inline diffs, Prettier formatting, and Dark Modern aesthetics.
- **Automated Extension Management**: One-click scripts (PowerShell & Batch) to install a curated stack of 27 development and tooling extensions.
- **Antigravity AI Agent Rules & MCP Servers**: Enterprise-grade engineering guidelines (`GEMINI.md`), knowledge graph workflows (`graphify`), and Model Context Protocol (MCP) server definitions.
- **Workspace Tooling**: Project-level `.agents` configuration and `.vscode` extension recommendations.

---

## Repository Structure

```text
├── GEMINI.md                            # Global AI pair programming instructions & engineering guidelines
├── antigravity_settings_export.md       # Consolidated architecture and settings reference
├── antigravity_state.pbtxt              # Antigravity onboarding and migration state
├── install_all_extensions.ps1 / .bat    # 1-click installer for all 27 curated extensions
├── install_missing_extensions.ps1 / .bat# 1-click delta installer for extensions
├── vscode_extensions_all.txt            # Complete list of curated extension IDs
├── vscode_extensions_missing.txt        # Delta list of missing extensions
├── vscode_extensions_recommendations.json # Recommended extensions template for .vscode/
│
├── antigravity_ide/                     # Antigravity IDE specific configurations
│   ├── settings.json                    # Antigravity IDE user settings
│   └── mcp_config_http.json             # HTTP-based MCP server configurations
│
├── gemini_config/                       # Global Gemini / Antigravity agent configurations
│   ├── config.json                      # Plugin states, permissions, and runtime settings
│   ├── mcp_config.json                  # stdio MCP server definitions (Context7, Graphify, Dart, Playwright)
│   ├── skills.json                      # Global skills directory pointer
│   └── projects/                        # Registered project profile templates
│
├── agents/                              # Agent skills metadata
│   └── .skill-lock.json                 # Lockfile for installed agent skills
│
├── vscode_migration/                    # VS Code migration suite & settings
│   └── vscode_settings.json             # Standardized VS Code User settings.json
│
└── workspace_agents/                    # Workspace project template (.agents/)
    ├── skills.json                      # Project skills configuration
    ├── rules/
    │   └── graphify.md                  # Project rule: Graphify knowledge graph integration
    └── workflows/
        └── graphify.md                  # Project workflow: Knowledge graph generation
```

---

## Quick Setup & Installation

### 1. VS Code Setup

#### Step A: Install Extensions
Run the installation script in terminal or PowerShell:
```powershell
# Using PowerShell:
.\install_all_extensions.ps1

# Or using Command Prompt:
install_all_extensions.bat
```

#### Step B: Apply User Settings
Merge the contents of `vscode_migration/vscode_settings.json` into your local VS Code User settings:
- **Windows:** `%APPDATA%\Code\User\settings.json`
- **macOS:** `~/Library/Application Support/Code/User/settings.json`
- **Linux:** `~/.config/Code/User/settings.json`

Key configurations include:
- Formatting on save & paste with Prettier
- Auto-save with delay
- Dart / Flutter SDK and Java Home path bindings
- Side-by-side diff disabled in favor of inline diff reviews
- Safe file deletion & native paste confirmations

#### Step C: Project Workspace Recommendations
Drop `vscode_extensions_recommendations.json` into your repository's `.vscode/extensions.json` to prompt contributors to install recommended workspace extensions.

---

### 2. Antigravity Agent & MCP Setup

#### Step A: Global Instructions
Copy `GEMINI.md` into your user home directory:
- **Path:** `~/.gemini/GEMINI.md` (or `%USERPROFILE%\.gemini\GEMINI.md`)

This establishes strict engineering rules (SOLID, descriptive English naming, zero AI slop, safe refactoring, and explicit error handling).

#### Step B: MCP Servers
Configure your MCP servers by deploying `gemini_config/mcp_config.json` to:
- `~/.gemini/config/mcp_config.json`

Bundled MCP servers:
- **Context7 (`@upstash/context7-mcp`)**: Official framework and library documentation search.
- **Graphify (`graphifyy`)**: Codebase knowledge graphs and AST dependency querying.
- **Dart MCP Server**: Language server tools for Dart/Flutter projects.
- **Playwright (`@playwright/mcp`)**: Headless browser testing and UI verification.

#### Step C: Workspace Rules
For individual projects, copy the contents of `workspace_agents/` into the project root under `.agents/`:
```text
your-project/
├── .agents/
│   ├── skills.json
│   ├── rules/
│   │   └── graphify.md
│   └── workflows/
│       └── graphify.md
```

---

## Curated Extension Stack (27 Extensions)

| Category | Extensions |
| :--- | :--- |
| **Mobile & Cross-Platform** | `dart-code.flutter`, `dart-code.dart-code`, `nash.awesome-flutter-snippets`, `robert-brunhage.flutter-riverpod-snippets`, `jeroen-meijer.pubspec-assist` |
| **Language Support** | `ms-python.python`, `ms-python.debugpy`, `golang.go`, `shopify.ruby-lsp`, `llvm-vs-code-extensions.vscode-clangd`, `meta.pyrefly` |
| **Code Quality & Utilities** | `esbenp.prettier-vscode`, `usernamehw.errorlens`, `aaron-bond.better-comments`, `formulahendry.code-runner`, `imgildev.vscode-code-log-plus` |
| **Git & Version Control** | `mhutchie.git-graph`, `donjayamanne.githistory`, `github.vscode-github-actions` |
| **Containers & DevOps** | `ms-azuretools.vscode-docker`, `ms-azuretools.vscode-containers` |
| **Documentation & Markdown** | `davidanson.vscode-markdownlint`, `shd101wyy.markdown-preview-enhanced`, `mathematic.vscode-pdf` |
| **UI & Agent Tools** | `pkief.material-icon-theme`, `ritwickdey.liveserver`, `jlcodes.antigravity-cockpit` |

---

## Security & Pre-Publish Checklist

> [!CAUTION]
> **Check before pushing to GitHub!**  
> If you are publishing this repository publicly or to a shared team remote, ensure you sanitize private tokens and local paths:

1. **API Keys & Tokens:**
   - Redact `"sourcery.token"` in `vscode_settings.json` and `antigravity_ide/settings.json`.
   - Redact `"CONTEXT7_API_KEY"` / `--api-key` in `gemini_config/mcp_config.json` and `antigravity_ide/mcp_config_http.json`.
2. **Local Hardcoded Paths:**
   - Check `dart.flutterSdkPath` and `java.jdt.ls.java.home` in settings files and update them to generic placeholders or environment variable paths.
3. **Environment & Project IDs:**
   - Sanitize project folders or user profiles in `gemini_config/projects/` and `antigravity_settings_export.md` if they contain proprietary file paths.

This repository serves as a centralized source of truth for:
- **Editor Settings (`settings.json`)**: Pre-configured for full-stack, mobile (Flutter/Dart), Python, and modern web development with optimized inline diffs, Prettier formatting, and Dark Modern aesthetics.
- **Automated Extension Management**: One-click scripts (PowerShell & Batch) to install a curated stack of 27 development and tooling extensions.
- **Antigravity AI Agent Rules & MCP Servers**: Enterprise-grade engineering guidelines (`GEMINI.md`), knowledge graph workflows (`graphify`), and Model Context Protocol (MCP) server definitions.
- **Workspace Tooling**: Project-level `.agents` configuration and `.vscode` extension recommendations.

---

## Repository Structure

```text
├── GEMINI.md                            # Global AI pair programming instructions & engineering guidelines
├── antigravity_settings_export.md       # Consolidated architecture and settings reference
├── antigravity_state.pbtxt              # Antigravity onboarding and migration state
├── install_all_extensions.ps1 / .bat    # 1-click installer for all 27 curated extensions
├── install_missing_extensions.ps1 / .bat# 1-click delta installer for extensions
├── vscode_extensions_all.txt            # Complete list of curated extension IDs
├── vscode_extensions_missing.txt        # Delta list of missing extensions
├── vscode_extensions_recommendations.json # Recommended extensions template for .vscode/
│
├── antigravity_ide/                     # Antigravity IDE specific configurations
│   ├── settings.json                    # Antigravity IDE user settings
│   └── mcp_config_http.json             # HTTP-based MCP server configurations
│
├── gemini_config/                       # Global Gemini / Antigravity agent configurations
│   ├── config.json                      # Plugin states, permissions, and runtime settings
│   ├── mcp_config.json                  # stdio MCP server definitions (Context7, Graphify, Dart, Playwright)
│   ├── skills.json                      # Global skills directory pointer
│   └── projects/                        # Registered project profile templates
│
├── agents/                              # Agent skills metadata
│   └── .skill-lock.json                 # Lockfile for installed agent skills
│
├── vscode_migration/                    # VS Code migration suite & settings
│   └── vscode_settings.json             # Standardized VS Code User settings.json
│
└── workspace_agents/                    # Workspace project template (.agents/)
    ├── skills.json                      # Project skills configuration
    ├── rules/
    │   └── graphify.md                  # Project rule: Graphify knowledge graph integration
    └── workflows/
        └── graphify.md                  # Project workflow: Knowledge graph generation
```

---

## Quick Setup & Installation

### 1. VS Code Setup

#### Step A: Install Extensions
Run the installation script in terminal or PowerShell:
```powershell
# Using PowerShell:
.\install_all_extensions.ps1

# Or using Command Prompt:
install_all_extensions.bat
```

#### Step B: Apply User Settings
Merge the contents of `vscode_migration/vscode_settings.json` into your local VS Code User settings:
- **Windows:** `%APPDATA%\Code\User\settings.json`
- **macOS:** `~/Library/Application Support/Code/User/settings.json`
- **Linux:** `~/.config/Code/User/settings.json`

Key configurations include:
- Formatting on save & paste with Prettier
- Auto-save with delay
- Dart / Flutter SDK and Java Home path bindings
- Side-by-side diff disabled in favor of inline diff reviews
- Safe file deletion & native paste confirmations

#### Step C: Project Workspace Recommendations
Drop `vscode_extensions_recommendations.json` into your repository's `.vscode/extensions.json` to prompt contributors to install recommended workspace extensions.

---

### 2. Antigravity Agent & MCP Setup

#### Step A: Global Instructions
Copy `GEMINI.md` into your user home directory:
- **Path:** `~/.gemini/GEMINI.md` (or `%USERPROFILE%\.gemini\GEMINI.md`)

This establishes strict engineering rules (SOLID, descriptive English naming, zero AI slop, safe refactoring, and explicit error handling).

#### Step B: MCP Servers
Configure your MCP servers by deploying `gemini_config/mcp_config.json` to:
- `~/.gemini/config/mcp_config.json`

Bundled MCP servers:
- **Context7 (`@upstash/context7-mcp`)**: Official framework and library documentation search.
- **Graphify (`graphifyy`)**: Codebase knowledge graphs and AST dependency querying.
- **Dart MCP Server**: Language server tools for Dart/Flutter projects.
- **Playwright (`@playwright/mcp`)**: Headless browser testing and UI verification.

#### Step C: Workspace Rules
For individual projects, copy the contents of `workspace_agents/` into the project root under `.agents/`:
```text
your-project/
├── .agents/
│   ├── skills.json
│   ├── rules/
│   │   └── graphify.md
│   └── workflows/
│       └── graphify.md
```

---

## Curated Extension Stack (27 Extensions)

| Category | Extensions |
| :--- | :--- |
| **Mobile & Cross-Platform** | `dart-code.flutter`, `dart-code.dart-code`, `nash.awesome-flutter-snippets`, `robert-brunhage.flutter-riverpod-snippets`, `jeroen-meijer.pubspec-assist` |
| **Language Support** | `ms-python.python`, `ms-python.debugpy`, `golang.go`, `shopify.ruby-lsp`, `llvm-vs-code-extensions.vscode-clangd`, `meta.pyrefly` |
| **Code Quality & Utilities** | `esbenp.prettier-vscode`, `usernamehw.errorlens`, `aaron-bond.better-comments`, `formulahendry.code-runner`, `imgildev.vscode-code-log-plus` |
| **Git & Version Control** | `mhutchie.git-graph`, `donjayamanne.githistory`, `github.vscode-github-actions` |
| **Containers & DevOps** | `ms-azuretools.vscode-docker`, `ms-azuretools.vscode-containers` |
| **Documentation & Markdown** | `davidanson.vscode-markdownlint`, `shd101wyy.markdown-preview-enhanced`, `mathematic.vscode-pdf` |
| **UI & Agent Tools** | `pkief.material-icon-theme`, `ritwickdey.liveserver`, `jlcodes.antigravity-cockpit` |

---

## Security & Pre-Publish Checklist

> [!CAUTION]
> **Check before pushing to GitHub!**  
> If you are publishing this repository publicly or to a shared team remote, ensure you sanitize private tokens and local paths:

1. **API Keys & Tokens:**
   - Redact `"sourcery.token"` in `vscode_settings.json` and `antigravity_ide/settings.json`.
   - Redact `"CONTEXT7_API_KEY"` / `--api-key` in `gemini_config/mcp_config.json` and `antigravity_ide/mcp_config_http.json`.
2. **Local Hardcoded Paths:**
   - Check `dart.flutterSdkPath` and `java.jdt.ls.java.home` in settings files and update them to generic placeholders or environment variable paths.
3. **Environment & Project IDs:**
   - Sanitize project folders or user profiles in `gemini_config/projects/` and `antigravity_settings_export.md` if they contain proprietary file paths.

