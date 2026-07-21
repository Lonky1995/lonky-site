import { NextRequest, NextResponse } from "next/server";

// 平仓转发：网页 → 本路由 → VPS gateway close API
// 密码即密钥，透传给 gateway 校验（同 portfolio/add）。平仓为软删除（status→closed）。

const GATEWAY_URL = process.env.PORTFOLIO_GATEWAY_URL || "http://154.219.115.80:18800";

type Body = { passcode?: string; symbol?: string };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const password = typeof body.passcode === "string" ? body.passcode.trim() : "";
  if (!password) return NextResponse.json({ error: "请填写密码" }, { status: 401 });
  if (!body.symbol || typeof body.symbol !== "string" || !body.symbol.trim()) {
    return NextResponse.json({ error: "缺少标的代码" }, { status: 400 });
  }

  const { passcode: _omit, ...forward } = body;
  void _omit;

  try {
    const res = await fetch(`${GATEWAY_URL}/api/portfolio/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-portfolio-key": password },
      body: JSON.stringify(forward),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        { error: (data.error as string) || `网关返回 ${res.status}` },
        { status: res.status === 401 ? 401 : 502 },
      );
    }
    return NextResponse.json({ ok: true, symbol: data.symbol });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "网关不可达";
    return NextResponse.json({ error: `提交失败：${msg}` }, { status: 502 });
  }
}
