'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Trade } from '@/lib/trading-analyzer/types';

interface KlineBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  trade: Trade;
  prevTrade: Trade | null;
  flagType: string;
  flagDetail: string;
  onClose: () => void;
}

function toBinanceSymbol(s: string): string {
  return s.replace('/USDT:USDT', 'USDT').replace('/', '');
}

function pickInterval(holdSec: number): string {
  if (holdSec < 300) return '1m';
  if (holdSec < 1800) return '5m';
  if (holdSec < 14400) return '15m';
  return '1h';
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const FLAG_LABELS: Record<string, string> = {
  revenge: '报复性交易',
  chasing: '追涨杀跌',
  doubleDown: '亏损后加仓',
  frequent: '频繁交易',
};

export default function FlaggedTradeDetail({ trade, prevTrade, flagType, flagDetail, onClose }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const holdSec = trade.hold_duration ?? 300;
    const interval = pickInterval(holdSec);
    const symbol = toBinanceSymbol(trade.symbol);

    // Context: show 3x hold duration before entry, 1x after exit
    const contextBefore = Math.max(holdSec * 3, 1800) * 1000;
    const contextAfter = Math.max(holdSec, 600) * 1000;
    const startTime = trade.open_time - contextBefore;
    const endTime = (trade.close_time ?? trade.open_time) + contextAfter;

    const url = `/api/tools/trading-analyzer/kline?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`;

    fetch(url)
      .then(r => r.json())
      .then(async (raw) => {
        if (!Array.isArray(raw) || raw.length === 0) {
          setError('无法获取 K 线数据');
          setLoading(false);
          return;
        }

        const klines: KlineBar[] = raw.map((k: any[]) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));

        const lw = await import('lightweight-charts');

        if (!chartRef.current) return;

        // Clean up previous chart
        if (chartInstanceRef.current) {
          chartInstanceRef.current.remove();
        }

        const chart = lw.createChart(chartRef.current, {
          width: chartRef.current.clientWidth,
          height: 300,
          layout: {
            background: { color: '#18181b' },
            textColor: '#71717a',
          },
          grid: {
            vertLines: { color: '#27272a' },
            horzLines: { color: '#27272a' },
          },
          crosshair: { mode: 0 },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chartInstanceRef.current = chart;

        const series = chart.addSeries(lw.CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        });

        series.setData(klines as any);

        // Entry / Exit markers
        const entryTime = Math.floor(trade.open_time / 1000) as any;
        const exitTime = trade.close_time ? Math.floor(trade.close_time / 1000) as any : null;
        const isLong = trade.side === 'long';

        const markers: any[] = [
          {
            time: entryTime,
            position: isLong ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: isLong ? 'arrowUp' : 'arrowDown',
            text: `${isLong ? '做多' : '做空'} $${trade.entry_price?.toFixed(1)}`,
          },
        ];

        if (exitTime) {
          markers.push({
            time: exitTime,
            position: isLong ? 'aboveBar' : 'belowBar',
            color: (trade.realized_pnl ?? 0) >= 0 ? '#22c55e' : '#ef4444',
            shape: isLong ? 'arrowDown' : 'arrowUp',
            text: `平仓 ${(trade.realized_pnl ?? 0) >= 0 ? '+' : ''}$${trade.realized_pnl?.toFixed(1)}`,
          });
        }

        // Previous trade marker (for revenge/chasing context)
        if (prevTrade?.close_time) {
          const prevExitTime = Math.floor(prevTrade.close_time / 1000) as any;
          const prevPnl = prevTrade.realized_pnl ?? 0;
          markers.push({
            time: prevExitTime,
            position: 'aboveBar',
            color: '#71717a',
            shape: 'circle',
            text: `前一笔 ${prevPnl >= 0 ? '+' : ''}$${prevPnl.toFixed(0)}`,
          });
        }

        // Sort markers by time
        markers.sort((a, b) => a.time - b.time);
        lw.createSeriesMarkers(series, markers);

        // Entry price line
        if (trade.entry_price) {
          series.createPriceLine({
            price: trade.entry_price,
            color: '#3b82f6',
            lineWidth: 1,
            lineStyle: 2, // dashed
            axisLabelVisible: true,
            title: '入场',
          });
        }

        // Fit content
        chart.timeScale().fitContent();

        // Responsive
        const resizeObserver = new ResizeObserver(() => {
          if (chartRef.current) {
            chart.applyOptions({ width: chartRef.current.clientWidth });
          }
        });
        resizeObserver.observe(chartRef.current);

        setLoading(false);

        return () => {
          resizeObserver.disconnect();
          chart.remove();
        };
      })
      .catch(() => {
        setError('K 线加载失败');
        setLoading(false);
      });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [trade, prevTrade]);

  const pnl = trade.realized_pnl ?? 0;
  const pnlColor = pnl >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 overflow-hidden rounded-none border border-border bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
            {FLAG_LABELS[flagType] || flagType}
          </span>
          <span className="text-sm text-foreground">{trade.symbol.replace('/USDT:USDT', '')}</span>
          <span className={`text-xs ${trade.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
            {trade.side === 'long' ? '做多' : '做空'}
          </span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Trade info bar */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border px-4 py-2 text-xs">
        <span className="text-muted">入场 <span className="text-foreground">{formatTime(trade.open_time)}</span></span>
        {trade.close_time && (
          <span className="text-muted">平仓 <span className="text-foreground">{formatTime(trade.close_time)}</span></span>
        )}
        <span className="text-muted">持仓 <span className="text-foreground">{formatDuration(trade.hold_duration ?? 0)}</span></span>
        <span className="text-muted">入场价 <span className="text-foreground">${trade.entry_price?.toFixed(2)}</span></span>
        {trade.exit_price && (
          <span className="text-muted">出场价 <span className="text-foreground">${trade.exit_price.toFixed(2)}</span></span>
        )}
        <span className="text-muted">盈亏 <span className={pnlColor}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span></span>
      </div>

      {/* Chart */}
      <div className="relative px-2 py-2">
        {loading && (
          <div className="flex h-[300px] items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent"
            />
          </div>
        )}
        {error && (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted">{error}</div>
        )}
        <div ref={chartRef} className={loading || error ? 'hidden' : ''} />
      </div>

      {/* AI Explanation */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs font-semibold text-red-400 mb-1">问题分析</p>
        <p className="text-sm leading-relaxed text-foreground/80">{flagDetail}</p>

        {prevTrade && (
          <div className="mt-2 rounded-none bg-card px-3 py-2 text-xs text-muted">
            <span className="font-medium text-foreground/60">前一笔交易：</span>
            {prevTrade.symbol.replace('/USDT:USDT', '')} {prevTrade.side === 'long' ? '做多' : '做空'}，
            盈亏 <span className={(prevTrade.realized_pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
              {(prevTrade.realized_pnl ?? 0) >= 0 ? '+' : ''}${(prevTrade.realized_pnl ?? 0).toFixed(2)}
            </span>
            ，间隔 {formatDuration(Math.round((trade.open_time - (prevTrade.close_time ?? prevTrade.open_time)) / 1000))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
