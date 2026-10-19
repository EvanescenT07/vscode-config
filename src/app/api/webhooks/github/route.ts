import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      { error: "Webhook receiver is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  const rawBody = await request.text();

  if (!isValidSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    JSON.parse(rawBody);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    throw error;
  }

  revalidateTag("repo-tree", "max");
  revalidateTag("repo-commits", "max");
  revalidateTag("repo-file", "max");

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
