import { NextResponse } from "next/server";

import { isCommitSha } from "@/lib/server/github-client";
import {
  getFilePayload,
  getRawFileContent,
} from "@/lib/server/repo-service";
import { errorResponse } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const ref = url.searchParams.get("ref");
  const rawOnly = url.searchParams.get("raw") === "1";

  if (!path) {
    return NextResponse.json(
      { error: "The path query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const payload = rawOnly
      ? await getRawFileContent(path, ref)
      : await getFilePayload(path, ref);

    const refValue = "ref" in payload ? payload.ref : "";
    const immutable = Boolean(refValue && isCommitSha(refValue));

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": immutable
          ? "public, max-age=31536000, immutable"
          : "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
