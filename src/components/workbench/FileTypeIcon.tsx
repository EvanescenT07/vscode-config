import { Bot, File, FileCode2, FileJson, FileText, Terminal } from "lucide-react";

import type { RepoFile } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface FileTypeIconProps {
  file: Pick<RepoFile, "name" | "path" | "category" | "isJson" | "isMarkdown">;
  className?: string;
}

export function FileTypeIcon({ file, className }: FileTypeIconProps) {
  if (file.category === "aiRules") {
    return <Bot className={cn("h-3.5 w-3.5 text-[#c9a5ff]", className)} aria-hidden="true" />;
  }

  if (file.category === "scripts") {
    return (
      <Terminal className={cn("h-3.5 w-3.5 text-[#7ee0b0]", className)} aria-hidden="true" />
    );
  }

  if (file.isJson) {
    return <FileJson className={cn("h-3.5 w-3.5 text-[#f0c674]", className)} aria-hidden="true" />;
  }

  if (file.isMarkdown) {
    return <FileText className={cn("h-3.5 w-3.5 text-[#7fb4ff]", className)} aria-hidden="true" />;
  }

  if (/\.(ts|tsx|js|jsx)$/i.test(file.name)) {
    return <FileCode2 className={cn("h-3.5 w-3.5 text-[#66b8e8]", className)} aria-hidden="true" />;
  }

  return <File className={cn("h-3.5 w-3.5 text-muted", className)} aria-hidden="true" />;
}
