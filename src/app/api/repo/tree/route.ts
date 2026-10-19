import { NextResponse } from "next/server";

import { getRepoTree } from "@/lib/server/repo-service";
import { errorResponse } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const tree = await getRepoTree();

    return NextResponse.json(tree, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
