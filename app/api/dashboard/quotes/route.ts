import { NextRequest, NextResponse } from 'next/server';

// 服务端代理 FMP 批量报价，key 不暴露给客户端
// 新版 FMP key（2025-08 后）只支持 /stable/*，旧 /api/v3/* 会 403
// FMP_API_KEY 未配置时返回 503，前端优雅降级显示 "—"
export async function GET(req: NextRequest) {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP_API_KEY not configured' }, { status: 503 });
  }

  const symbols = req.nextUrl.searchParams.get('symbols');
  // 只允许合法 ticker 列表，防止把任意路径拼进 FMP URL
  if (!symbols || !/^[A-Z0-9.\-]{1,10}(,[A-Z0-9.\-]{1,10}){0,29}$/.test(symbols)) {
    return NextResponse.json({ error: 'Invalid symbols' }, { status: 400 });
  }

  try {
    // stable batch-quote：一次拉多标的；apikey 走 query（FMP 官方写法）
    const res = await fetch(
      `https://financialmodelingprep.com/stable/batch-quote?symbols=${encodeURIComponent(symbols)}&apikey=${apiKey}`,
      { next: { revalidate: 60 } } // 缓存 60s，防 FMP 限频
    );
    if (!res.ok) {
      // 透传一点 FMP 信息方便排障（不带 key）
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.['Error Message'] || body?.error || '';
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        { error: `FMP ${res.status}`, detail: detail || undefined },
        { status: 502 }
      );
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Unexpected FMP response' }, { status: 502 });
    }

    const quotes = data.map((q: Record<string, unknown>) => ({
      symbol: q.symbol,
      price: q.price,
      // v3: changesPercentage · stable: changePercentage
      changesPercentage: q.changePercentage ?? q.changesPercentage ?? 0,
      marketCap: q.marketCap ?? null,
      pe: q.pe ?? null,
    }));
    return NextResponse.json({ quotes, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'FMP fetch failed' }, { status: 502 });
  }
}
