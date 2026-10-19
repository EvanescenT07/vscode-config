import { NextResponse } from "next/server";

import { getSearchIndex } from "@/lib/server/repo-service";
import { errorResponse } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const index = await getSearchIndex();

    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
