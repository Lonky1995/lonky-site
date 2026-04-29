'use client';

import { motion } from 'framer-motion';
import type { FullAnalysis, Trade } from '@/lib/trading-analyzer/types';
import StatCards from './StatCards';
import TraderProfile from './TraderProfile';
import PnlDistribution from './PnlDistribution';
import TradingHeatmap from './TradingHeatmap';
import RiskGauge from './RiskGauge';
import AIDiagnosis from './AIDiagnosis';

interface Props {
  analysis: FullAnalysis;
  trades: Trade[];
  onReset: () => void;
}

export default function ResultDashboard({ analysis, trades, onReset }: Props) {
  const { stats, habits, discipline, diagnosis } = analysis;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          分析结果
          <span className="ml-2 text-sm font-normal text-muted">
            （{trades.length} 笔交易）
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            导出报告
          </button>
          <button
            onClick={onReset}
            className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            重新分析
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <StatCards stats={stats} />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-xs font-semibold text-muted">交易者画像</h3>
          <TraderProfile scores={diagnosis.radarScores} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-xs font-semibold text-muted">盈亏分布</h3>
          <PnlDistribution data={stats.pnlDistribution} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-xs font-semibold text-muted">风险倾向</h3>
          <RiskGauge score={diagnosis.riskScore} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold text-muted">交易频率热力图 (UTC)</h3>
        <TradingHeatmap data={stats.heatmap} />
      </div>

      {/* AI Diagnosis */}
      <AIDiagnosis diagnosis={diagnosis} habits={habits} discipline={discipline} trades={trades} />
    </motion.div>
  );
}
