import type { Metadata, Viewport } from "next";

import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VSCode Config & AI Rules Hub",
    template: "%s | VSCode Config Hub",
  },
  description:
    "A fast workbench for VS Code settings, AI agent rules, and commit history from EvanescenT07/vscode-config.",
  applicationName: "VSCode Config & AI Rules Hub",
  authors: [{ name: "EvanescenT07" }],
  keywords: [
    "VS Code",
    "settings.json",
    "AI agent rules",
    "developer tooling",
    "config hub",
  ],
  openGraph: {
    title: "VSCode Config & AI Rules Hub",
    description:
      "Browse IDE configs, compose AI rule bundles, and inspect config history in one VS Code-inspired workbench.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
