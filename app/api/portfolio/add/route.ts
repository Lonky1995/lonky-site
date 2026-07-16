import { NextRequest, NextResponse } from "next/server";

// 仓位录入转发：网页表单 → 本路由（服务端持密钥）→ VPS gateway 写入 API
// 密钥只在服务端，浏览器永远看不到。gateway 地址 + 密钥来自环境变量。

const GATEWAY_URL = process.env.PORTFOLIO_GATEWAY_URL || "http://154.219.115.80:18800";
const WRITE_KEY = process.env.PORTFOLIO_WRITE_KEY || "";
// 页面提交口令：浏览器填写，随请求发来，服务端比对。与下游 gateway 密钥分离。
const FORM_PASSCODE = process.env.PORTFOLIO_FORM_PASSCODE || "";

type Body = {
  passcode?: string;
  symbol?: string;
  direction?: string;
  size?: string;
  entryTime?: number;
  entryPrice?: string;
  logic?: string;
  plan?: string;
  validate?: string;
  invalidate?: string;
  stopLoss?: string;
  conviction?: number;
};

export async function POST(req: NextRequest) {
  if (!WRITE_KEY || !FORM_PASSCODE) {
    return NextResponse.json({ error: "录入未启用：服务端未配置密钥/口令" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  // 口令校验（防止任意人写入）
  if (typeof body.passcode !== "string" || body.passcode !== FORM_PASSCODE) {
    return NextResponse.json({ error: "口令错误" }, { status: 401 });
  }

  // 必填校验（前端也校验，这里兜底）
  const required = ["symbol", "direction", "size", "logic", "validate", "invalidate"] as const;
  for (const f of required) {
    const v = body[f];
    if (typeof v !== "string" || !v.trim()) {
      return NextResponse.json({ error: `缺少必填字段：${f}` }, { status: 400 });
    }
  }
  if (body.direction !== "long" && body.direction !== "short") {
    return NextResponse.json({ error: "方向必须是 long 或 short" }, { status: 400 });
  }

  // 转发给 gateway 的 payload 去掉 passcode（下游不需要）
  const { passcode: _omit, ...forward } = body;
  void _omit;

  try {
    const res = await fetch(`${GATEWAY_URL}/api/portfolio/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-portfolio-key": WRITE_KEY,
      },
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
