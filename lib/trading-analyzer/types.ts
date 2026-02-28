// Trade record (no DB dependencies, compatible with stats-engine)
export interface Trade {
  id: string;
  exchange: 'binance';
  symbol: string;
  side: 'long' | 'short';
  open_time: number;
  close_time: number | null;
  hold_duration: number | null;
  entry_price: number | null;
  exit_price: number | null;
  quantity: number | null;
  leverage: number | null;
  notional_value: number | null;
  realized_pnl: number | null;
  pnl_percent: number | null;
  fee: number | null;
  has_stop_loss: number;
  has_take_profit: number;
  raw_order_ids: string;
}

// --- Stats types (identical to original for stats-engine compatibility) ---

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  avgPnlPercent: number;
  profitFactor: number;
  avgHoldDuration: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgLeverage: number;
  leverageStdDev: number;
  stopLossRate: number;
  takeProfitRate: number;
  byExchange: Record<string, ExchangeStats>;
  bySymbol: Record<string, SymbolStats>;
  bySide: { long: SideStats; short: SideStats };
  holdDurationBuckets: DurationBucket[];
  pnlDistribution: PnlBucket[];
  hourlyFrequency: number[];
  weekdayFrequency: number[];
  heatmap: number[][];
}

export interface ExchangeStats {
  count: number;
  winRate: number;
  totalPnl: number;
}

export interface SymbolStats {
  count: number;
  winRate: number;
  totalPnl: number;
  avgHoldDuration: number;
}

export interface SideStats {
  count: number;
  winRate: number;
  totalPnl: number;
  avgPnlPercent: number;
}

export interface DurationBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  winRate: number;
}

export interface PnlBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

// --- Enhanced AI analysis types ---

export interface HabitsAnalysis {
  traderType: string;
  positionManagementScore: number;
  riskControlScore: number;
  detailedBreakdown: {
    bestSymbol: { symbol: string; reason: string };
    worstSymbol: { symbol: string; reason: string };
    directionBias: string;
  };
  suggestions: string[];
}

export interface MoneyManagementAnalysis {
  maxDrawdownStreak: { trades: number; totalLoss: number; period: string };
  avgWinAmount: number;
  avgLossAmount: number;
  largestWin: number;
  largestLoss: number;
  winLossRatio: number;
  positionSizeConsistency: number;
  leverageAfterLoss: 'increasing' | 'stable' | 'decreasing';
  moneyManagementScore: number;
  criticalIssues: string[];
  rules: string[];
}

export interface TimingAnalysis {
  holdTimeAnalysis: {
    winAvgHold: string;
    lossAvgHold: string;
    verdict: string;
  };
  sessionPerformance: Record<string, { count: number; winRate: number; avgPnl: number }>;
  tradeIntervalAnalysis: string;
  timingSuggestions: string[];
}

export interface DisciplineAnalysis {
  chasingRate: number;
  revengeTradeRate: number;
  doubleDownAfterLossRate: number;
  disciplineScore: number;
  flaggedTrades: Array<{ time: string; type: string; detail: string }>;
  patterns: string[];
  suggestions: string[];
}

export interface Diagnosis {
  oneLiner: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  actionItems: string[];
  tradingRules: string[];
  riskScore: number;
  radarScores: {
    profitability: number;
    riskControl: number;
    discipline: number;
    timing: number;
    consistency: number;
    moneyManagement: number;
  };
}

export interface FullAnalysis {
  stats: TradeStats;
  habits: HabitsAnalysis;
  moneyManagement: MoneyManagementAnalysis;
  timing: TimingAnalysis;
  discipline: DisciplineAnalysis;
  diagnosis: Diagnosis;
}
