import type { Trade, TradeStats, ExchangeStats, SymbolStats, SideStats, DurationBucket, PnlBucket } from './types';

export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter(t => t.close_time != null);
  if (closed.length === 0) {
    return emptyStats();
  }

  const wins = closed.filter(t => (t.realized_pnl ?? 0) > 0);
  const losses = closed.filter(t => (t.realized_pnl ?? 0) <= 0);

  const totalProfit = wins.reduce((s, t) => s + (t.realized_pnl ?? 0), 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.realized_pnl ?? 0), 0));

  // Consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0, consecWins = 0, consecLosses = 0;
  for (const t of closed.sort((a, b) => a.open_time - b.open_time)) {
    if ((t.realized_pnl ?? 0) > 0) {
      consecWins++;
      consecLosses = 0;
      maxConsecWins = Math.max(maxConsecWins, consecWins);
    } else {
      consecLosses++;
      consecWins = 0;
      maxConsecLosses = Math.max(maxConsecLosses, consecLosses);
    }
  }

  // Leverage stats
  const leverages = closed.filter(t => t.leverage != null).map(t => t.leverage!);
  const avgLev = leverages.length > 0 ? leverages.reduce((s, v) => s + v, 0) / leverages.length : 0;
  const levStd = leverages.length > 1
    ? Math.sqrt(leverages.reduce((s, v) => s + (v - avgLev) ** 2, 0) / (leverages.length - 1))
    : 0;

  // Duration buckets
  const durationBuckets: DurationBucket[] = [
    { label: '<1min', min: 0, max: 60, count: 0, winRate: 0 },
    { label: '1-5min', min: 60, max: 300, count: 0, winRate: 0 },
    { label: '5-15min', min: 300, max: 900, count: 0, winRate: 0 },
    { label: '15min-1h', min: 900, max: 3600, count: 0, winRate: 0 },
    { label: '1-4h', min: 3600, max: 14400, count: 0, winRate: 0 },
    { label: '4-24h', min: 14400, max: 86400, count: 0, winRate: 0 },
    { label: '>24h', min: 86400, max: Infinity, count: 0, winRate: 0 },
  ];

  const bucketWins: number[] = new Array(durationBuckets.length).fill(0);
  for (const t of closed) {
    const dur = t.hold_duration ?? 0;
    for (let i = 0; i < durationBuckets.length; i++) {
      if (dur >= durationBuckets[i].min && dur < durationBuckets[i].max) {
        durationBuckets[i].count++;
        if ((t.realized_pnl ?? 0) > 0) bucketWins[i]++;
        break;
      }
    }
  }
  durationBuckets.forEach((b, i) => {
    b.winRate = b.count > 0 ? bucketWins[i] / b.count : 0;
  });

  // PnL distribution
  const pnlBuckets: PnlBucket[] = [
    { label: '<-10%', min: -Infinity, max: -10, count: 0 },
    { label: '-10~-5%', min: -10, max: -5, count: 0 },
    { label: '-5~-2%', min: -5, max: -2, count: 0 },
    { label: '-2~0%', min: -2, max: 0, count: 0 },
    { label: '0~2%', min: 0, max: 2, count: 0 },
    { label: '2~5%', min: 2, max: 5, count: 0 },
    { label: '5~10%', min: 5, max: 10, count: 0 },
    { label: '>10%', min: 10, max: Infinity, count: 0 },
  ];
  for (const t of closed) {
    const pct = t.pnl_percent ?? 0;
    for (const b of pnlBuckets) {
      if (pct >= b.min && pct < b.max) {
        b.count++;
        break;
      }
    }
  }

  // By exchange
  const byExchange: Record<string, ExchangeStats> = {};
  for (const t of closed) {
    if (!byExchange[t.exchange]) byExchange[t.exchange] = { count: 0, winRate: 0, totalPnl: 0 };
    byExchange[t.exchange].count++;
    byExchange[t.exchange].totalPnl += t.realized_pnl ?? 0;
  }
  for (const ex of Object.keys(byExchange)) {
    const exTrades = closed.filter(t => t.exchange === ex);
    const exWins = exTrades.filter(t => (t.realized_pnl ?? 0) > 0);
    byExchange[ex].winRate = exWins.length / exTrades.length;
  }

  // By symbol
  const bySymbol: Record<string, SymbolStats> = {};
  for (const t of closed) {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { count: 0, winRate: 0, totalPnl: 0, avgHoldDuration: 0 };
    bySymbol[t.symbol].count++;
    bySymbol[t.symbol].totalPnl += t.realized_pnl ?? 0;
  }
  for (const sym of Object.keys(bySymbol)) {
    const symTrades = closed.filter(t => t.symbol === sym);
    const symWins = symTrades.filter(t => (t.realized_pnl ?? 0) > 0);
    bySymbol[sym].winRate = symWins.length / symTrades.length;
    bySymbol[sym].avgHoldDuration = symTrades.reduce((s, t) => s + (t.hold_duration ?? 0), 0) / symTrades.length;
  }

  // By side
  const longTrades = closed.filter(t => t.side === 'long');
  const shortTrades = closed.filter(t => t.side === 'short');
  const bySide = {
    long: {
      count: longTrades.length,
      winRate: longTrades.length > 0 ? longTrades.filter(t => (t.realized_pnl ?? 0) > 0).length / longTrades.length : 0,
      totalPnl: longTrades.reduce((s, t) => s + (t.realized_pnl ?? 0), 0),
      avgPnlPercent: longTrades.length > 0 ? longTrades.reduce((s, t) => s + (t.pnl_percent ?? 0), 0) / longTrades.length : 0,
    },
    short: {
      count: shortTrades.length,
      winRate: shortTrades.length > 0 ? shortTrades.filter(t => (t.realized_pnl ?? 0) > 0).length / shortTrades.length : 0,
      totalPnl: shortTrades.reduce((s, t) => s + (t.realized_pnl ?? 0), 0),
      avgPnlPercent: shortTrades.length > 0 ? shortTrades.reduce((s, t) => s + (t.pnl_percent ?? 0), 0) / shortTrades.length : 0,
    },
  };

  // Hourly and weekday frequency + heatmap
  const hourlyFrequency = new Array(24).fill(0);
  const weekdayFrequency = new Array(7).fill(0);
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  for (const t of closed) {
    const d = new Date(t.open_time);
    const h = d.getUTCHours();
    const w = d.getUTCDay();
    hourlyFrequency[h]++;
    weekdayFrequency[w]++;
    heatmap[w][h]++;
  }

  return {
    totalTrades: closed.length,
    winRate: wins.length / closed.length,
    avgPnlPercent: closed.reduce((s, t) => s + (t.pnl_percent ?? 0), 0) / closed.length,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
    avgHoldDuration: closed.reduce((s, t) => s + (t.hold_duration ?? 0), 0) / closed.length,
    maxConsecutiveWins: maxConsecWins,
    maxConsecutiveLosses: maxConsecLosses,
    avgLeverage: avgLev,
    leverageStdDev: levStd,
    stopLossRate: closed.filter(t => t.has_stop_loss).length / closed.length,
    takeProfitRate: closed.filter(t => t.has_take_profit).length / closed.length,
    byExchange,
    bySymbol,
    bySide,
    holdDurationBuckets: durationBuckets,
    pnlDistribution: pnlBuckets,
    hourlyFrequency,
    weekdayFrequency,
    heatmap,
  };
}

function emptyStats(): TradeStats {
  return {
    totalTrades: 0, winRate: 0, avgPnlPercent: 0, profitFactor: 0,
    avgHoldDuration: 0, maxConsecutiveWins: 0, maxConsecutiveLosses: 0,
    avgLeverage: 0, leverageStdDev: 0, stopLossRate: 0, takeProfitRate: 0,
    byExchange: {}, bySymbol: {}, bySide: { long: { count: 0, winRate: 0, totalPnl: 0, avgPnlPercent: 0 }, short: { count: 0, winRate: 0, totalPnl: 0, avgPnlPercent: 0 } },
    holdDurationBuckets: [], pnlDistribution: [],
    hourlyFrequency: new Array(24).fill(0),
    weekdayFrequency: new Array(7).fill(0),
    heatmap: Array.from({ length: 7 }, () => new Array(24).fill(0)),
  };
}
