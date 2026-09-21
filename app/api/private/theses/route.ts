import { NextResponse } from "next/server";
import { readThesisSnapshot } from "@/lib/thesis-store";

export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.json(await readThesisSnapshot(), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "thesis_read_failed" }, { status: 500 }); }
}
