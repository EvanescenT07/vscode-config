import type { Metadata } from "next";

import { Workbench } from "@/components/workbench/Workbench";
import { loadInitialHistory } from "@/lib/server/page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commit History",
  description:
    "Inspect the commit timeline, structured diffs, and historical file versions for EvanescenT07/vscode-config.",
};

export default async function HistoryPage() {
  const { tree, error, commits } = await loadInitialHistory();

  return (
    <Workbench
      initialTree={tree}
      initialError={error}
      initialCommits={commits}
      initialView="history"
    />
  );
}
