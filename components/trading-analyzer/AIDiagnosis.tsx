'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Diagnosis, HabitsAnalysis, DisciplineAnalysis, Trade } from '@/lib/trading-analyzer/types';
import FlaggedTradeDetail from './FlaggedTradeDetail';

interface Props {
  diagnosis: Diagnosis;
  habits: HabitsAnalysis;
  discipline: DisciplineAnalysis;
  trades: Trade[];
}

function parseFlexibleTime(timeStr: string, trades: Trade[]): number {
  // Try ISO / standard Date parse first
  const direct = new Date(timeStr).getTime();
  if (!isNaN(direct)) return direct;

  // Handle "M/D HH:mm" or "M/D" without year — infer year from trades
  const m = timeStr.match(/^(\d{1,2})\/(\d{1,2})\s*(\d{1,2}):(\d{2})?/);
  if (m) {
    const refYear = trades.length > 0 ? new Date(trades[0].open_time).getFullYear() : new Date().getFullYear();
    const d = new Date(refYear, parseInt(m[1]) - 1, parseInt(m[2]), parseInt(m[3] || '0'), parseInt(m[4] || '0'));
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Handle "X月X日 HH:mm"
  const m2 = timeStr.match(/(\d{1,2})月(\d{1,2})日?\s*(\d{1,2}):(\d{2})/);
  if (m2) {
    const refYear = trades.length > 0 ? new Date(trades[0].open_time).getFullYear() : new Date().getFullYear();
    const d = new Date(refYear, parseInt(m2[1]) - 1, parseInt(m2[2]), parseInt(m2[3]), parseInt(m2[4]));
    if (!isNaN(d.getTime())) return d.getTime();
  }

  return NaN;
}

function findMatchingTrade(trades: Trade[], timeStr: string): { trade: Trade; prevTrade: Trade | null } | null {
  const sorted = [...trades].sort((a, b) => a.open_time - b.open_time);
  const targetTime = parseFlexibleTime(timeStr, sorted);

  let bestIdx = -1;
  let bestDiff = Infinity;

  for (let i = 0; i < sorted.length; i++) {
    const diff = Math.abs(sorted[i].open_time - (isNaN(targetTime) ? 0 : targetTime));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  // If time parsing failed, try fuzzy text match on the time string
  if (isNaN(targetTime) && timeStr) {
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i].open_time);
      const tradeStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      if (timeStr.includes(tradeStr) || tradeStr.includes(timeStr.replace(/\s+/g, ' ').trim())) {
        return {
          trade: sorted[i],
          prevTrade: i > 0 ? sorted[i - 1] : null,
        };
      }
    }
    return null;
  }

  // Match within 10 minutes
  if (bestIdx < 0 || bestDiff > 10 * 60 * 1000) return null;

  return {
    trade: sorted[bestIdx],
    prevTrade: bestIdx > 0 ? sorted[bestIdx - 1] : null,
  };
}

export default function AIDiagnosis({ diagnosis, habits, discipline, trades }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="space-y-5 rounded-none border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted">AI 综合诊断</h3>
        <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
          {habits.traderType}
        </span>
      </div>

      <p className="text-lg font-semibold text-foreground">{diagnosis.oneLiner}</p>
      <p className="text-sm leading-relaxed text-muted">{diagnosis.summary}</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-green-400">优势</h4>
          <ul className="space-y-1">
            {diagnosis.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="text-green-400">{'\u2713'}</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-amber-400">改进方向</h4>
          <ul className="space-y-1">
            {diagnosis.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="text-amber-400">!</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-cyan-400">行动建议</h4>
          <ul className="space-y-1">
            {diagnosis.actionItems.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="text-cyan-400">{'\u2192'}</span>{s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Flagged Trades — clickable with K-line chart */}
      {discipline.flaggedTrades && discipline.flaggedTrades.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-red-400">
            问题交易 ({discipline.flaggedTrades.length})
            <span className="ml-2 font-normal text-muted">点击查看 K 线复盘</span>
          </h4>
          <div className="space-y-2">
            {discipline.flaggedTrades.slice(0, 8).map((ft, i) => {
              const match = findMatchingTrade(trades, ft.time);
              const isExpanded = expandedIdx === i;

              return (
                <div key={i}>
                  <div
                    className={`rounded-none border px-3 py-2 text-xs transition-colors cursor-pointer ${
                      isExpanded
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-red-500/10 bg-red-500/5 hover:border-red-500/30'
                    }`}
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-red-400">[{ft.type}]</span>
                      <span className="text-muted">{ft.time}</span>
                      <span className="text-foreground/70 flex-1">{ft.detail}</span>
                      <span className="shrink-0 text-muted">
                        {isExpanded ? '\u25B2' : '\u25BC'}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && match && (
                      <FlaggedTradeDetail
                        trade={match.trade}
                        prevTrade={match.prevTrade}
                        flagType={ft.type}
                        flagDetail={ft.detail}
                        onClose={() => setExpandedIdx(null)}
                      />
                    )}
                    {isExpanded && !match && (
                      <div className="mt-2 rounded-none border border-border bg-background px-4 py-3 text-xs text-muted">
                        未能匹配到对应交易记录
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trading Rules */}
      {diagnosis.tradingRules && diagnosis.tradingRules.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-accent">
            你的交易规则
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {diagnosis.tradingRules.map((rule, i) => (
              <div
                key={i}
                className="rounded-none border border-accent/20 bg-accent/5 px-3 py-2 text-sm text-foreground/80"
              >
                {rule}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
