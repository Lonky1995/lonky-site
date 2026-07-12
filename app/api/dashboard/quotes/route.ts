import { NextRequest, NextResponse } from 'next/server';

// 服务端代理 FMP 报价，key 不暴露给客户端
// 新版 FMP key（2025-08 后）只支持 /stable/*，旧 /api/v3/* 已停用
// 当前订阅套餐不含 /stable/batch-quote（402），改用 /stable/quote 逐个并发请求
// FMP_API_KEY 未配置时返回 503，前端优雅降级显示 "—"
export async function GET(req: NextRequest) {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP_API_KEY not configured' }, { status: 503 });
  }

  const symbolsParam = req.nextUrl.searchParams.get('symbols');
  // 只允许合法 ticker 列表，防止把任意路径拼进 FMP URL
  if (!symbolsParam || !/^[A-Z0-9.\-]{1,10}(,[A-Z0-9.\-]{1,10}){0,29}$/.test(symbolsParam)) {
    return NextResponse.json({ error: 'Invalid symbols' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',');

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const res = await fetch(
          `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
          { next: { revalidate: 60 } } // 缓存 60s，防 FMP 限频
        );
        if (!res.ok) return null;
        const data: unknown = await res.json();
        if (!Array.isArray(data) || !data[0]) return null;
        const q = data[0] as Record<string, unknown>;
        return {
          symbol: q.symbol,
          price: q.price,
          changesPercentage: q.changePercentage ?? q.changesPercentage ?? 0,
          marketCap: q.marketCap ?? null,
          pe: q.pe ?? null,
        };
      })
    );

    const quotes = results.filter(Boolean);
    if (quotes.length === 0) {
      return NextResponse.json({ error: 'FMP fetch failed for all symbols' }, { status: 502 });
    }
    return NextResponse.json({ quotes, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'FMP fetch failed' }, { status: 502 });
  }
}
