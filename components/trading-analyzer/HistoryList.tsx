'use client';

import { motion } from 'framer-motion';
import type { HistoryRecord } from '@/lib/trading-analyzer/history';

interface Props {
  records: HistoryRecord[];
  onSelect: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
}

export default function HistoryList({ records, onSelect, onDelete }: Props) {
  if (records.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto mt-6 max-w-lg"
    >
      <h3 className="mb-3 text-xs font-semibold text-muted">历史记录</h3>
      <div className="space-y-2">
        {records.map((r, i) => {
          const d = new Date(r.date);
          const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          const pnlColor = r.totalPnl >= 0 ? 'text-green-400' : 'text-red-400';

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group flex items-center gap-3 rounded-none border border-border bg-card px-4 py-3 transition-colors hover:bg-card-hover cursor-pointer"
              onClick={() => onSelect(r)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted">{dateStr}</span>
                  <span className="text-foreground/60">·</span>
                  <span className="text-foreground/80">{r.tradeCount} 笔</span>
                  <span className="text-foreground/60">·</span>
                  <span className="text-foreground/80">{(r.winRate * 100).toFixed(0)}%</span>
                  <span className={pnlColor}>
                    {r.totalPnl >= 0 ? '+' : ''}${r.totalPnl.toFixed(0)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{r.oneLiner}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(r.id); }}
                className="shrink-0 text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                title="删除"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
