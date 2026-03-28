'use client';

import { motion } from 'framer-motion';

const STEPS = [
  { key: 'stats', label: '计算统计指标', icon: '1' },
  { key: 'habits', label: '分析交易习惯', icon: '2' },
  { key: 'moneyManagement', label: '分析资金管理', icon: '3' },
  { key: 'timing', label: '分析择时能力', icon: '4' },
  { key: 'discipline', label: '分析情绪纪律', icon: '5' },
  { key: 'diagnosis', label: '生成综合诊断', icon: '6' },
];

interface Props {
  progress: Record<string, any>;
}

export default function AnalysisProgress({ progress }: Props) {
  const completedKeys = Object.keys(progress);
  const currentIdx = completedKeys.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-md space-y-4"
    >
      <div className="rounded-none border border-border bg-card p-6 space-y-3">
        {STEPS.map((step, i) => {
          const isDone = completedKeys.includes(step.key);
          const isActive = !isDone && i <= currentIdx;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-green-500/20 text-green-400'
                    : isActive
                      ? 'bg-accent/20 text-accent'
                      : 'bg-border/50 text-muted'
                }`}
              >
                {isDone ? '\u2713' : step.icon}
              </div>
              <span
                className={`text-sm ${
                  isDone ? 'text-green-400' : isActive ? 'text-foreground' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
              {isActive && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        AI 分析中... 大约需要 20-30 秒
      </p>
    </motion.div>
  );
}
