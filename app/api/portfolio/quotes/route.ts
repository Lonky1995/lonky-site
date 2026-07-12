import { NextRequest, NextResponse } from "next/server";

// 组合追踪器行情：美股走 FMP（服务端代理，key 不暴露），加密走 Binance 公共 API
// 前端用返回的 price 实时算 PNL

const CRYPTO = new Set(["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "DOT", "LINK"]);

type Quote = { symbol: string; price: number; changesPercentage: number };

async function fetchStock(symbol: string, apiKey: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;
    const q = data[0] as Record<string, unknown>;
    return {
      symbol,
      price: Number(q.price) || 0,
      changesPercentage: Number(q.changePercentage ?? q.changesPercentage ?? 0),
    };
  } catch {
    return null;
  }
}

async function fetchCrypto(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const q = (await res.json()) as Record<string, unknown>;
    return {
      symbol,
      price: parseFloat(String(q.lastPrice)) || 0,
      changesPercentage: parseFloat(String(q.priceChangePercent)) || 0,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols");
  if (!symbolsParam || !/^[A-Z0-9.\-]{1,10}(,[A-Z0-9.\-]{1,10}){0,29}$/.test(symbolsParam)) {
    return NextResponse.json({ error: "Invalid symbols" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",");
  const apiKey = process.env.FMP_API_KEY;

  const results = await Promise.all(
    symbols.map((sym) => {
      if (CRYPTO.has(sym)) return fetchCrypto(sym);
      if (!apiKey) return Promise.resolve(null);
      return fetchStock(sym, apiKey);
    }),
  );

  const quotes = results.filter((q): q is Quote => q !== null);
  if (quotes.length === 0) {
    return NextResponse.json({ error: "No quotes available" }, { status: 502 });
  }
  return NextResponse.json({ quotes, fetchedAt: new Date().toISOString() });
}
