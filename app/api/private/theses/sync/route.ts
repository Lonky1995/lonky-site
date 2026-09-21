import { NextRequest, NextResponse } from "next/server";
import { validSyncSignature } from "@/lib/thesis-auth";
import { type ThesisSnapshot, writeThesisSnapshot } from "@/lib/thesis-store";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSyncSignature(raw, req.headers.get("x-thesis-timestamp"), req.headers.get("x-thesis-signature"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let snapshot: ThesisSnapshot;
  try { snapshot = JSON.parse(raw) as ThesisSnapshot; } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.theses) || typeof snapshot.syncedAt !== "string") return NextResponse.json({ error: "invalid_snapshot" }, { status: 400 });
  try { await writeThesisSnapshot(snapshot); return NextResponse.json({ ok: true, count: snapshot.theses.length }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "thesis_sync_failed" }, { status: 500 }); }
}
