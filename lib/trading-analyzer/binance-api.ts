import crypto from 'crypto';
import type { Trade } from './types';
import { pairFillsIntoPositions, positionsToTrades, type RawFill } from './fill-pairer';

const BINANCE_FAPI = 'https://fapi.binance.com';

const BINANCE_FUTURES_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT',
  'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT',
  'LINKUSDT', 'DOTUSDT', 'ARBUSDT', 'OPUSDT',
  'SUIUSDT', 'PEPEUSDT', 'WIFUSDT', 'NEARUSDT',
  'AAVEUSDT', 'UNIUSDT', 'FTMUSDT', 'MATICUSDT',
];

interface BinanceFuturesTrade {
  id: number;
  symbol: string;
  orderId: number;
  side: string;
  price: string;
  qty: string;
  realizedPnl: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  buyer: boolean;
  maker: boolean;
}

function binanceSign(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function getBinanceServerTime(): Promise<number> {
  const res = await fetch(`${BINANCE_FAPI}/fapi/v1/time`);
  const { serverTime } = await res.json() as { serverTime: number };
  return serverTime;
}

async function fetchSymbolTrades(
  apiKey: string,
  secret: string,
  symbol: string,
  since: number,
  timeOffset: number,
): Promise<RawFill[]> {
  const fills: RawFill[] = [];
  const ccxtSymbol = symbol.replace('USDT', '/USDT:USDT');
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const now = Date.now() + timeOffset;
  const windows: Array<{ start: number; end: number }> = [];
  let windowEnd = now;
  while (windowEnd > since) {
    const windowStart = Math.max(windowEnd - WEEK_MS, since);
    windows.push({ start: windowStart, end: windowEnd });
    windowEnd = windowStart;
  }

  for (const { start, end } of windows) {
    let fromId: number | undefined;

    while (true) {
      const ts = Date.now() + timeOffset;
      let params = `symbol=${symbol}&startTime=${start}&endTime=${end}&timestamp=${ts}&recvWindow=10000&limit=1000`;
      if (fromId !== undefined) {
        params += `&fromId=${fromId}`;
      }
      const signature = binanceSign(params, secret);
      const url = `${BINANCE_FAPI}/fapi/v1/userTrades?${params}&signature=${signature}`;

      const res = await fetch(url, {
        headers: { 'X-MBX-APIKEY': apiKey },
      });
      const data = await res.json() as BinanceFuturesTrade[] | { code: number; msg: string };

      if (!Array.isArray(data)) {
        if ((data as any).code === -2015) {
          throw new Error('Invalid API Key or Secret. Please check your credentials.');
        }
        break;
      }
      if (data.length === 0) break;

      fills.push(...data.map(t => ({
        id: String(t.id),
        symbol: ccxtSymbol,
        side: t.side.toLowerCase(),
        price: parseFloat(t.price),
        amount: parseFloat(t.qty),
        cost: parseFloat(t.quoteQty),
        fee: { cost: parseFloat(t.commission), currency: t.commissionAsset },
        timestamp: t.time,
        order: String(t.orderId),
        info: t,
      })));

      if (data.length < 1000) break;
      fromId = data[data.length - 1].id + 1;
    }
  }

  return fills;
}

export async function fetchAllBinanceTrades(
  apiKey: string,
  secret: string,
  days: number = 7,
  symbols?: string[],
): Promise<Trade[]> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const symbolList = symbols ?? BINANCE_FUTURES_SYMBOLS;

  // Get server time offset once
  const localNow = Date.now();
  const serverTime = await getBinanceServerTime();
  const timeOffset = serverTime - localNow;

  // Fetch symbols in parallel batches of 5
  const allFills: RawFill[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < symbolList.length; i += CONCURRENCY) {
    const batch = symbolList.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(sym => fetchSymbolTrades(apiKey, secret, sym, since, timeOffset))
    );
    for (const fills of results) {
      allFills.push(...fills);
    }
  }

  if (allFills.length === 0) {
    return [];
  }

  const positions = pairFillsIntoPositions(allFills);
  return positionsToTrades(positions);
}
