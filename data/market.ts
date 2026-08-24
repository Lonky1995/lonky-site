export type PostureFactor = { key: string; label: string; score: number; raw: number; note: string };
export type PostureHistoryPoint = { date: string; score: number; trend: number; credit: number; vol: number; leadership: number; breadth: number; liquidity: number };
export type PostureData = { methodologyVersion?: string; date: string; score: number; verdict: string; factors: PostureFactor[]; updatedAt: number; history?: PostureHistoryPoint[] };
export type AssetCard = { key: string; label: string; group: string; price: number; changePct: number; spark: number[] };
export type CrossAssetData = { date: string; summary: string; cards: AssetCard[]; updatedAt: number };
export type PositioningComponent = { key: string; label: string; value: number | null; percentile: number | null; windowPoints: number; date: string; source: "cftc" | "naaim" | "cta-model" };
export type CtaEtf = { symbol: string; weight: number; price: number; ma50: number; signal: "long" | "flat" };
export type PositioningData = { date: string; crowding: number | null; components: PositioningComponent[]; cta: CtaEtf[]; updatedAt: number };
