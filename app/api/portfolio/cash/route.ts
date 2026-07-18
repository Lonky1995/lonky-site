import { NextRequest, NextResponse } from "next/server";

// 现金余额：读取无需密码；写入需密码（透传给 VPS gateway 校验，同 add 路由机制）。
// 总资产 = 持仓市值 + 现金。

const GATEWAY_URL = process.env.PORTFOLIO_GATEWAY_URL || "http://154.219.115.80:18800";

type Body = { passcode?: string; amount?: number };

// GET：读取当前现金（公开）
export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/portfolio/cash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json({ error: "读取失败" }, { status: 502 });
    }
    return NextResponse.json({ amount: data.amount ?? 0, updatedAt: data.updatedAt ?? 0 });
  } catch {
    return NextResponse.json({ error: "网关不可达" }, { status: 502 });
  }
}

// POST：设置现金（需密码）
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const password = typeof body.passcode === "string" ? body.passcode.trim() : "";
  if (!password) {
    return NextResponse.json({ error: "请填写密码" }, { status: 401 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "现金金额必须为非负数字" }, { status: 400 });
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/api/portfolio/cash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-portfolio-key": password,
      },
      body: JSON.stringify({ amount }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        { error: (data.error as string) || `网关返回 ${res.status}` },
        { status: res.status === 401 ? 401 : 502 },
      );
    }
    return NextResponse.json({ ok: true, amount: data.amount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "网关不可达";
    return NextResponse.json({ error: `提交失败：${msg}` }, { status: 502 });
  }
}
