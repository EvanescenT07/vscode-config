import { NextResponse } from "next/server";

import { getSearchIndex } from "@/lib/server/repo-service";
import { errorResponse } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const index = await getSearchIndex();

    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
