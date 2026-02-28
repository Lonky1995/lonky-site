/**
 * Fetch market context for each trade's open/close time.
 * All Binance public endpoints — no auth needed.
 *
 * Indicators:
 * - Funding rate (8h)
 * - Open interest + 4h change
 * - RSI-14, MACD, Bollinger Band position (from 1h klines)
 * - Price change 1h/4h
 * - Long/Short account ratio (Binance global)
 * - Taker buy/sell ratio
 */

import type { Trade } from './types';

export interface MarketSnapshot {
  fundingRate: number | null;
  openInterest: number | null;
  oiChange4h: number | null;
  rsi14: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  bollingerPosition: string | null; // "above_upper" | "upper_half" | "lower_half" | "below_lower"
  priceChange1h: number | null;
  priceChange4h: number | null;
  longShortRatio: number | null;
  takerBuySellRatio: number | null;
}

export interface TradeWithMarket {
  open_time: string;
  close_time: string | null;
  side: string;
  symbol: string;
  entry_price: number | null;
  exit_price: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  hold_duration_sec: number | null;
  leverage: number | null;
  quantity: number | null;
  notional: number | null;
  market: MarketSnapshot;
}

const BINANCE = 'https://fapi.binance.com';

function toBinanceSymbol(s: string): string {
  return s.replace('/USDT:USDT', 'USDT').replace('/', '');
}

async function safeFetch(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return null;
  }
}

// ── Funding Rate ──
async function fetchFundingRate(symbol: string, ts: number): Promise<number | null> {
  const data = await safeFetch(`${BINANCE}/fapi/v1/fundingRate?symbol=${symbol}&endTime=${ts}&limit=1`);
  return Array.isArray(data) && data.length > 0 ? parseFloat(data[0].fundingRate) : null;
}

// ── Open Interest ──
async function fetchOI(symbol: string, ts: number): Promise<{ current: number | null; change4h: number | null }> {
  const start = ts - 4 * 3600_000;
  const data = await safeFetch(`${BINANCE}/futures/data/openInterestHist?symbol=${symbol}&period=1h&startTime=${start}&endTime=${ts}&limit=5`);
  if (!Array.isArray(data) || data.length === 0) return { current: null, change4h: null };
  const latest = parseFloat(data[data.length - 1].sumOpenInterestValue);
  const earliest = parseFloat(data[0].sumOpenInterestValue);
  return { current: latest, change4h: earliest > 0 ? (latest - earliest) / earliest : null };
}

// ── Long/Short Account Ratio ──
async function fetchLongShortRatio(symbol: string, ts: number): Promise<number | null> {
  const data = await safeFetch(`${BINANCE}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1&startTime=${ts - 3600_000}&endTime=${ts}`);
  if (Array.isArray(data) && data.length > 0) return parseFloat(data[data.length - 1].longShortRatio);
  return null;
}

// ── Taker Buy/Sell Ratio ──
async function fetchTakerRatio(symbol: string, ts: number): Promise<number | null> {
  const data = await safeFetch(`${BINANCE}/futures/data/takerlongshortRatio?symbol=${symbol}&period=1h&limit=1&startTime=${ts - 3600_000}&endTime=${ts}`);
  if (Array.isArray(data) && data.length > 0) return parseFloat(data[data.length - 1].buySellRatio);
  return null;
}

// ── Technical indicators from klines ──
function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    d > 0 ? (gainSum += d) : (lossSum -= d);
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function computeEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  let ema = data.slice(0, period).reduce((s, v) => s + v, 0) / period;
  const k = 2 / (period + 1);
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * k + ema;
  }
  return ema;
}

function computeMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < 35) return null; // need 26+9 lookback
  // Build MACD line series for signal line EMA
  const macdSeries: number[] = [];
  for (let end = 26; end <= closes.length; end++) {
    const slice = closes.slice(0, end);
    const ema12 = computeEMA(slice, 12);
    const ema26 = computeEMA(slice, 26);
    if (ema12 !== null && ema26 !== null) macdSeries.push(ema12 - ema26);
  }
  if (macdSeries.length < 9) return null;
  const macdLine = macdSeries[macdSeries.length - 1];
  const signalLine = computeEMA(macdSeries, 9);
  if (signalLine === null) return null;
  return {
    macd: Math.round(macdLine * 100) / 100,
    signal: Math.round(signalLine * 100) / 100,
    histogram: Math.round((macdLine - signalLine) * 100) / 100,
  };
}

function computeBollingerPosition(closes: number[], period = 20): string | null {
  if (closes.length < period) return null;
  const recent = closes.slice(-period);
  const sma = recent.reduce((s, v) => s + v, 0) / period;
  const std = Math.sqrt(recent.reduce((s, v) => s + (v - sma) ** 2, 0) / period);
  const upper = sma + 2 * std;
  const lower = sma - 2 * std;
  const price = closes[closes.length - 1];
  if (price > upper) return 'above_upper';
  if (price > sma) return 'upper_half';
  if (price > lower) return 'lower_half';
  return 'below_lower';
}

async function fetchTechnicals(symbol: string, ts: number) {
  // 50 candles of 1h: enough for RSI(14), MACD(26+9=35), Bollinger(20)
  const start = ts - 50 * 3600_000;
  const data = await safeFetch(`${BINANCE}/fapi/v1/klines?symbol=${symbol}&interval=1h&startTime=${start}&endTime=${ts}&limit=50`);
  if (!Array.isArray(data) || data.length < 2) {
    return { rsi14: null, macd: null, bollingerPosition: null, priceChange1h: null, priceChange4h: null };
  }
  const closes = data.map((k: any[]) => parseFloat(k[4]));
  const last = closes[closes.length - 1];
  return {
    rsi14: computeRSI(closes),
    macd: computeMACD(closes),
    bollingerPosition: computeBollingerPosition(closes),
    priceChange1h: closes.length >= 2 ? (last - closes[closes.length - 2]) / closes[closes.length - 2] : null,
    priceChange4h: closes.length >= 5 ? (last - closes[closes.length - 5]) / closes[closes.length - 5] : null,
  };
}

// ── Main snapshot ──
async function fetchSnapshot(symbol: string, timestamp: number): Promise<MarketSnapshot> {
  const sym = toBinanceSymbol(symbol);

  const [funding, oi, tech, lsRatio, takerRatio] = await Promise.all([
    fetchFundingRate(sym, timestamp),
    fetchOI(sym, timestamp),
    fetchTechnicals(sym, timestamp),
    fetchLongShortRatio(sym, timestamp),
    fetchTakerRatio(sym, timestamp),
  ]);

  const r = (v: number | null, d = 1) => v !== null ? Math.round(v * 10 ** d) / 10 ** d : null;
  const pct = (v: number | null) => v !== null ? Math.round(v * 10000) / 100 : null;

  return {
    fundingRate: funding,
    openInterest: oi.current,
    oiChange4h: pct(oi.change4h),
    rsi14: r(tech.rsi14),
    macd: tech.macd,
    bollingerPosition: tech.bollingerPosition,
    priceChange1h: pct(tech.priceChange1h),
    priceChange4h: pct(tech.priceChange4h),
    longShortRatio: r(lsRatio, 2),
    takerBuySellRatio: r(takerRatio, 2),
  };
}

/**
 * Fetch market snapshots for all trades.
 * Deduplicates by symbol+hour to avoid redundant API calls.
 */
export async function fetchMarketSnapshots(trades: Trade[]): Promise<Map<number, MarketSnapshot>> {
  const results = new Map<number, MarketSnapshot>();

  // Group by symbol + rounded hour
  const groups = new Map<string, number[]>();
  for (const t of trades) {
    const key = `${t.symbol}_${Math.floor(t.open_time / 3600_000)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t.open_time);
  }

  // Fetch in batches of 5
  const entries = [...groups.entries()];
  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5);
    const snapshots = await Promise.all(
      batch.map(([key]) => {
        const [symbol] = key.split('_');
        return fetchSnapshot(symbol, groups.get(key)![0]);
      }),
    );
    batch.forEach(([key], idx) => {
      for (const ts of groups.get(key)!) {
        results.set(ts, snapshots[idx]);
      }
    });
  }

  return results;
}

const emptySnapshot: MarketSnapshot = {
  fundingRate: null, openInterest: null, oiChange4h: null,
  rsi14: null, macd: null, bollingerPosition: null,
  priceChange1h: null, priceChange4h: null,
  longShortRatio: null, takerBuySellRatio: null,
};

/**
 * Enrich trades with market context for AI consumption.
 */
export function enrichTradesWithMarket(trades: Trade[], snapshots: Map<number, MarketSnapshot>): TradeWithMarket[] {
  return trades
    .filter(t => t.close_time)
    .sort((a, b) => a.open_time - b.open_time)
    .slice(0, 80)
    .map(t => ({
      open_time: new Date(t.open_time).toISOString(),
      close_time: t.close_time ? new Date(t.close_time).toISOString() : null,
      side: t.side,
      symbol: t.symbol.replace('/USDT:USDT', ''),
      entry_price: t.entry_price ?? null,
      exit_price: t.exit_price ?? null,
      pnl: t.realized_pnl ?? null,
      pnl_percent: t.pnl_percent ?? null,
      hold_duration_sec: t.hold_duration ?? null,
      leverage: t.leverage ?? null,
      quantity: t.quantity ?? null,
      notional: t.notional_value ?? null,
      market: snapshots.get(t.open_time) ?? emptySnapshot,
    }));
}
