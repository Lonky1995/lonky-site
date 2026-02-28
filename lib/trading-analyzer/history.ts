import type { FullAnalysis, Trade } from './types';

const STORAGE_KEY = 'trading-analyzer-history';
const MAX_RECORDS = 20;

export interface HistoryRecord {
  id: string;
  date: string;
  tradeCount: number;
  days: number;
  winRate: number;
  totalPnl: number;
  oneLiner: string;
  analysis: FullAnalysis;
  trades: Trade[];
}

export function saveRecord(analysis: FullAnalysis, trades: Trade[], days: number): HistoryRecord {
  const totalPnl = Object.values(analysis.stats.byExchange).reduce((s, e) => s + e.totalPnl, 0);
  const record: HistoryRecord = {
    id: Date.now().toString(36),
    date: new Date().toISOString(),
    tradeCount: analysis.stats.totalTrades,
    days,
    winRate: analysis.stats.winRate,
    totalPnl,
    oneLiner: analysis.diagnosis.oneLiner,
    analysis,
    trades,
  };

  const list = getHistory();
  list.unshift(record);
  if (list.length > MAX_RECORDS) list.length = MAX_RECORDS;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage full — drop oldest
    list.length = Math.floor(list.length / 2);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  return record;
}

export function getHistory(): HistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteRecord(id: string) {
  const list = getHistory().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
