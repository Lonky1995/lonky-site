import { NextRequest, NextResponse } from "next/server";

// 标的校验：录入时校验代码是否真实存在，并返回公司/项目全称。
// 美股走 FMP search-symbol，加密走 Binance ticker 兜底。

// VELO 是美股 Velo3D，不是加密货币
const CRYPTO = new Set(["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "DOT", "LINK"]);

type Result = { ok: boolean; symbol: string; name?: string; kind?: "stock" | "crypto"; error?: string };

async function validateStock(symbol: string, apiKey: string): Promise<Result> {
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return { ok: false, symbol, error: `FMP ${res.status}` };
    const data = (await res.json()) as Array<{ symbol: string; name: string }>;
    if (!Array.isArray(data) || data.length === 0) {
      return { ok: false, symbol, error: "未找到该美股代码" };
    }
    // 精确匹配优先
    const exact = data.find((d) => d.symbol.toUpperCase() === symbol.toUpperCase()) ?? data[0];
    return { ok: true, symbol: exact.symbol.toUpperCase(), name: exact.name, kind: "stock" };
  } catch (e) {
    return { ok: false, symbol, error: e instanceof Error ? e.message : "校验失败" };
  }
}

async function validateCrypto(symbol: string): Promise<Result> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true, symbol, name: `${symbol} (加密货币)`, kind: "crypto" };
    return { ok: false, symbol, error: "Binance 无此交易对" };
  } catch {
    return { ok: false, symbol, error: "校验失败" };
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbol") || "";
  const symbol = raw.trim().replace(/^\$/, "").toUpperCase();
  if (!/^[A-Z0-9.\-]{1,10}$/.test(symbol)) {
    return NextResponse.json({ ok: false, symbol, error: "代码格式无效" }, { status: 400 });
  }

  const apiKey = process.env.FMP_API_KEY || "";

  // 加密名单直接走 Binance；其余先试美股，失败再试加密兜底
  if (CRYPTO.has(symbol)) {
    const c = await validateCrypto(symbol);
    if (c.ok) return NextResponse.json(c);
  }
  if (apiKey) {
    const s = await validateStock(symbol, apiKey);
    if (s.ok) return NextResponse.json(s);
    // 美股没找到，最后试加密
    const c = await validateCrypto(symbol);
    if (c.ok) return NextResponse.json(c);
    return NextResponse.json(s); // 返回美股的错误信息
  }
  const c = await validateCrypto(symbol);
  return NextResponse.json(c);
}
