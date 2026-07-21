import { NextResponse } from "next/server";
import { hasMongoUri } from "../../../../lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    mongoConfigured: hasMongoUri(),
    hint: hasMongoUri()
      ? "MONGO_URI is set. Try submitting the contact form."
      : "MONGO_URI is NOT set on this deployment. Add it in Vercel env vars and redeploy.",
  });
}
