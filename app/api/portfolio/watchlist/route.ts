import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.PORTFOLIO_GATEWAY_URL || "http://154.219.115.80:18800";

type WatchlistWriteBody = {
  passcode?: string;
  symbol?: string;
  name?: string;
  priority?: "core" | "normal" | "idea";
  tags?: string[];
  thesis?: string;
  focus?: string[];
  enabled?: boolean;
};

async function parseResponse(res: Response) {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/watchlist`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      return NextResponse.json({ error: (data.error as string) || `网关返回 ${res.status}` }, { status: 502 });
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "网关不可达";
    return NextResponse.json({ error: `读取关注列表失败：${message}` }, { status: 502 });
  }
}

async function forwardWrite(req: NextRequest, method: "POST" | "DELETE") {
  let body: WatchlistWriteBody;
  try {
    body = (await req.json()) as WatchlistWriteBody;
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const passcode = body.passcode?.trim() || "";
  const symbol = body.symbol?.trim().replace(/^\$/, "").toUpperCase() || "";
  if (!passcode) return NextResponse.json({ error: "请输入 Portfolio 密码" }, { status: 401 });
  if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol)) {
    return NextResponse.json({ error: "请输入有效的股票代码" }, { status: 400 });
  }

  const { passcode: _omit, ...payload } = body;
  void _omit;

  try {
    const res = await fetch(`${GATEWAY_URL}/api/watchlist`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-portfolio-key": passcode,
      },
      body: JSON.stringify({ ...payload, symbol }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      return NextResponse.json(
        { error: (data.error as string) || `网关返回 ${res.status}` },
        { status: (data.error as string) === "unauthorized" ? 401 : 502 },
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "网关不可达";
    return NextResponse.json({ error: `更新关注列表失败：${message}` }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  return forwardWrite(req, "POST");
}

export async function DELETE(req: NextRequest) {
  return forwardWrite(req, "DELETE");
}
