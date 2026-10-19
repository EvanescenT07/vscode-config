import "server-only";

import { NextResponse } from "next/server";

import {
  GitHubApiError,
  RepositoryConfigError,
} from "@/lib/server/github-client";
import { RequestValidationError } from "@/lib/server/repo-service";

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof GitHubApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof RequestValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof RepositoryConfigError) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  throw error;
}
