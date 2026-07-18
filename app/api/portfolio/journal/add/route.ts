import { NextRequest, NextResponse } from "next/server";

// 追踪日记录入转发：网页 → 本路由 → VPS gateway journal API
// 密码即密钥，透传给 gateway 校验（同 portfolio/add）

const GATEWAY_URL = process.env.PORTFOLIO_GATEWAY_URL || "http://154.219.115.80:18800";

type Body = { passcode?: string; symbol?: string; mood?: string; content?: string };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const password = typeof body.passcode === "string" ? body.passcode.trim() : "";
  if (!password) return NextResponse.json({ error: "请填写密码" }, { status: 401 });
  if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const { passcode: _omit, ...forward } = body;
  void _omit;

  try {
    const res = await fetch(`${GATEWAY_URL}/api/portfolio/journal/add`, {
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
    return NextResponse.json({ ok: true, id: data.id, symbol: data.symbol });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "网关不可达";
    return NextResponse.json({ error: `提交失败：${msg}` }, { status: 502 });
  }
}
