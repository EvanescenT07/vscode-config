import { Workbench } from "@/components/workbench/Workbench";
import { loadInitialTree } from "@/lib/server/page-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { tree, error } = await loadInitialTree();

  return <Workbench initialTree={tree} initialError={error} />;
}
