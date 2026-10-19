import { NextResponse } from "next/server";

import { getRepoTree } from "@/lib/server/repo-service";
import { errorResponse } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const tree = await getRepoTree();

    return NextResponse.json(tree, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
