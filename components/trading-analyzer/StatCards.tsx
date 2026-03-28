'use client';

import { motion } from 'framer-motion';
import type { TradeStats } from '@/lib/trading-analyzer/types';

export default function StatCards({ stats }: { stats: TradeStats }) {
  const totalPnl = Object.values(stats.byExchange).reduce((s, e) => s + e.totalPnl, 0);

  const cards = [
    {
      label: '总交易数',
      value: stats.totalTrades.toString(),
      color: 'text-foreground',
    },
    {
      label: '胜率',
      value: `${(stats.winRate * 100).toFixed(1)}%`,
      color: stats.winRate >= 0.5 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: '盈亏比',
      value: stats.profitFactor === Infinity ? '\u221e' : stats.profitFactor.toFixed(2),
      color: stats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: '总盈亏',
      value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`,
      color: totalPnl >= 0 ? 'text-green-400' : 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-none border border-border bg-card p-4"
        >
          <p className="text-xs text-muted">{c.label}</p>
          <p className={`mt-1 text-xl font-bold ${c.color}`}>{c.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
