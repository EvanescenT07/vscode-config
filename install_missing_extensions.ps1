# Install missing extensions into VS Code
$missing = @(
    'nash.awesome-flutter-snippets'
    'imgildev.vscode-code-log-plus'
    'llvm-vs-code-extensions.vscode-clangd'
    'formulahendry.code-runner'
    'jlcodes.antigravity-cockpit'
    'robert-brunhage.flutter-riverpod-snippets'
    'mhutchie.git-graph'
    'aaron-bond.better-comments'
    'mathematic.vscode-pdf'
    'davidanson.vscode-markdownlint'
    'jeroen-meijer.pubspec-assist'
    'usernamehw.errorlens'
    'shopify.ruby-lsp'
    'shd101wyy.markdown-preview-enhanced'
    'meta.pyrefly'
)

Write-Host "Installing missing extensions into VS Code..." -ForegroundColor Cyan
foreach ($ext in $missing) {
    Write-Host "Installing $ext..." -ForegroundColor Yellow
    code --install-extension $ext --force
}
Write-Host "Finished installing missing extensions!" -ForegroundColor Green
