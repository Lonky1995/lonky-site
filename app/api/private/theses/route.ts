import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/podcast/auth";
import { isThesisOwner } from "@/lib/thesis-auth";
import { readThesisSnapshot } from "@/lib/thesis-store";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const session = await auth(req);
  if (!session?.user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  if (!isThesisOwner(session.user.id)) return NextResponse.json({ error: "owner_only" }, { status: 403 });
  try { return NextResponse.json(await readThesisSnapshot(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "thesis_read_failed" }, { status: 500 }); }
}
