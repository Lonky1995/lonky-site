export type PositionDirection = "long" | "short";

export type Position = {
  id: string;
  symbol: string;
  companyName?: string;
  direction: PositionDirection;
  size: string;
  entryTime: number;
  entryPrice?: string;
  logic: string;
  plan?: string;
  validate: string;
  invalidate: string;
  stopLoss?: string;
  conviction: number;
  lastReview?: string;
};

export type WatchItem = {
  type: "event" | "validate" | "risk" | "todo";
  symbol: string;
  text: string;
};

export type EquityPoint = {
  t: string;
  v: number;
};

export type PortfolioData = {
  generatedAt: string;
  positions: Position[];
  watchlist: WatchItem[];
  equityCurve: EquityPoint[];
  cash?: number;
};

// 市场广度（由 gateway breadth-snapshot cron 生成，推送到 public/data/breadth.json）
export type BreadthData = {
  date: string; // 最新交易日 YYYY-MM-DD
  universe: string; // 'SP100'
  pctAbove200: number; // 站上 200 日线的成分股比例 0-100
  pctAbove50: number; // 站上 50 日线的比例
  advancers: number; // 当日上涨家数
  decliners: number; // 当日下跌家数
  adDiff: number; // advancers - decliners
  breadthScore: number; // 0-100 合成广度分
  updatedAt: number;
};

// 市场姿态因子
export type PostureFactor = {
  key: string; // trend / breadth / credit / vol / leadership
  label: string; // 中文标签
  score: number; // 0-100
  raw: number; // 原始值（展示用）
  note: string; // 一句话状态
};

// 市场姿态（由 gateway posture-snapshot cron 生成，推送到 public/data/posture.json）
export type PostureData = {
  date: string;
  score: number; // 0-100 合成姿态分
  verdict: string; // 积极 / 选择性 / 谨慎
  factors: PostureFactor[];
  updatedAt: number;
};

export const QUOTE_KIND: Record<string, "stock" | "crypto"> = {
  BTC: "crypto",
  ETH: "crypto",
  SOL: "crypto",
  BNB: "crypto",
  XRP: "crypto",
};

export function quoteKind(symbol: string): "stock" | "crypto" {
  return QUOTE_KIND[symbol.toUpperCase()] ?? "stock";
}
