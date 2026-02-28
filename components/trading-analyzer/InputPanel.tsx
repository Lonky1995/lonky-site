'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onSubmit: (apiKey: string, secret: string, days: number) => void;
  error: string | null;
}

export default function InputPanel({ onSubmit, error }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [secret, setSecret] = useState('');
  const [days, setDays] = useState(7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-lg space-y-6"
    >
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Binance API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="输入你的 API Key"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">API Secret</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="输入你的 API Secret"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">时间范围</label>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  days === d
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted hover:border-accent/50'
                }`}
              >
                {d} 天
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={() => onSubmit(apiKey, secret, days)}
          disabled={!apiKey || !secret}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          开始分析
        </button>
      </div>

      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs leading-relaxed text-yellow-400/80">
        <p className="mb-1 font-medium text-yellow-400">安全提示</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>请创建<strong>只读</strong> API Key — 不要开启交易或提币权限</li>
          <li>你的 Key 仅用于拉取交易记录，<strong>不会被存储</strong></li>
          <li>所有分析在浏览器 + 云函数中运行</li>
        </ul>
      </div>
    </motion.div>
  );
}
