import { NextRequest, NextResponse } from "next/server";

// 追踪日记列表：转发到 gateway 读 journal.json（公开读，无需密码）

const GATEWAY_URL = process.env.PORTFOLIO_GATEWAY_URL || "http://154.219.115.80:18800";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  try {
    const res = await fetch(`${GATEWAY_URL}/api/portfolio/journal/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(symbol ? { symbol } : {}),
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 0 },
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; entries?: unknown[] };
    if (!res.ok) return NextResponse.json({ entries: [] }, { status: 200 });
    return NextResponse.json({ entries: data.entries ?? [] });
  } catch {
    return NextResponse.json({ entries: [] }, { status: 200 });
  }
}
