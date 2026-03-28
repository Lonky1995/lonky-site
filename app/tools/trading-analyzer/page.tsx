'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InputPanel from '@/components/trading-analyzer/InputPanel';
import AnalysisProgress from '@/components/trading-analyzer/AnalysisProgress';
import ResultDashboard from '@/components/trading-analyzer/ResultDashboard';
import HistoryList from '@/components/trading-analyzer/HistoryList';
import type { Trade, FullAnalysis } from '@/lib/trading-analyzer/types';
import { saveRecord, getHistory, deleteRecord, type HistoryRecord } from '@/lib/trading-analyzer/history';

type Step = 'input' | 'fetching' | 'analyzing' | 'result';

export default function TradingAnalyzerPage() {
  const [step, setStep] = useState<Step>('input');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleSubmit = useCallback(async (apiKey: string, secret: string, d: number) => {
    setError(null);
    setProgress({});
    setAnalysis(null);
    setDays(d);
    setStep('fetching');

    try {
      const fetchRes = await fetch('/api/tools/trading-analyzer/fetch-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, secret, days: d }),
      });

      if (!fetchRes.ok) {
        const err = await fetchRes.json().catch(() => ({ error: 'Failed to fetch trades' }));
        throw new Error(err.error || 'Failed to fetch trades');
      }

      const { trades: fetchedTrades, count } = await fetchRes.json();

      if (count === 0) {
        throw new Error('未找到已平仓交易。请尝试更长的时间范围，或检查 API Key 权限。');
      }

      setTrades(fetchedTrades);
      setStep('analyzing');

      const analyzeRes = await fetch('/api/tools/trading-analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: fetchedTrades }),
      });

      if (!analyzeRes.ok) {
        throw new Error('Analysis failed');
      }

      const reader = analyzeRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const result: Record<string, any> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === 'error') {
                throw new Error(parsed.data.message);
              }
              if (parsed.type !== 'done') {
                result[parsed.type] = parsed.data;
                setProgress(prev => ({ ...prev, [parsed.type]: parsed.data }));
              }
            } catch (e: any) {
              if (e.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      const fullAnalysis = result as FullAnalysis;
      setAnalysis(fullAnalysis);

      // 自动存档
      saveRecord(fullAnalysis, fetchedTrades, d);
      setHistory(getHistory());

      setStep('result');
    } catch (err: any) {
      setError(err.message);
      setStep('input');
    }
  }, []);

  const handleReset = useCallback(() => {
    setStep('input');
    setTrades([]);
    setAnalysis(null);
    setProgress({});
    setError(null);
  }, []);

  const handleSelectHistory = useCallback((record: HistoryRecord) => {
    setTrades(record.trades);
    setAnalysis(record.analysis);
    setStep('result');
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    deleteRecord(id);
    setHistory(getHistory());
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="mb-2 text-3xl font-bold">
          <span className="gradient-text">交易风格分析器</span>
        </h1>
        <p className="text-sm text-muted">
          连接你的 Binance 合约账户，AI 自动分析你的交易行为
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" exit={{ opacity: 0, y: -20 }}>
            <InputPanel onSubmit={handleSubmit} error={error} />
            <HistoryList
              records={history}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
            />
          </motion.div>
        )}

        {step === 'fetching' && (
          <motion.div
            key="fetching"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto max-w-md text-center"
          >
            <div className="rounded-none border border-border bg-card p-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-accent border-t-transparent"
              />
              <p className="text-sm text-foreground">正在从 Binance 拉取交易记录...</p>
              <p className="mt-1 text-xs text-muted">大约需要 10-30 秒</p>
            </div>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <AnalysisProgress key="analyzing" progress={progress} />
        )}

        {step === 'result' && analysis && (
          <ResultDashboard
            key="result"
            analysis={analysis}
            trades={trades}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
