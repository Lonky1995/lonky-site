import { NextRequest, NextResponse } from 'next/server';
import { fetchAllBinanceTrades } from '@/lib/trading-analyzer/binance-api';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { apiKey, secret, days = 7, symbols } = await req.json();

    if (!apiKey || !secret) {
      return NextResponse.json({ error: 'API Key and Secret are required' }, { status: 400 });
    }

    const trades = await fetchAllBinanceTrades(apiKey, secret, days, symbols);

    // Filter to closed trades only
    const closedTrades = trades.filter(t => t.close_time != null);

    return NextResponse.json({
      trades: closedTrades,
      count: closedTrades.length,
      totalFetched: trades.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch trades' },
      { status: 500 },
    );
  }
}
