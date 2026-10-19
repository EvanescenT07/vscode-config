import { NextResponse } from "next/server";

import { getCommitDetail } from "@/lib/server/repo-service";
import { errorResponse } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sha: string }> },
): Promise<NextResponse> {
  const { sha } = await context.params;

  try {
    const commit = await getCommitDetail(sha);

    return NextResponse.json(commit, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
