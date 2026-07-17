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
