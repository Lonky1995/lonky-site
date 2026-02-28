import { NextRequest, NextResponse } from 'next/server';

// Proxy to Binance public klines — no auth needed
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '5m';
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');

  if (!symbol || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=500`;
  const res = await fetch(url);
  const data = await res.json();

  return NextResponse.json(data);
}
