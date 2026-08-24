"use client";

import MarketBreadth from "@/components/market/MarketBreadth";
import CrossAsset from "@/components/market/CrossAsset";
import Positioning from "@/components/market/Positioning";

/** Public market observatory. It intentionally consumes only the published
 * macro snapshots and never reads portfolio, watchlist, journal, or user data. */
export default function MarketDashboard() {
  return (
    <div className="pf-page">
      <header className="pf-header" data-reveal>
        <div>
          <p className="apple-eyebrow">公开市场观察</p>
          <h1>Market.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            宏观状态、跨资产联动与资金拥挤度。所有结论仅基于页面标明的快照时间；过期或周频数据不应当作实时交易信号。
          </p>
        </div>
      </header>

      <div className="mt-10 flex items-baseline gap-3 border-t border-white/10 pt-6" data-reveal>
        <span className="font-mono text-sm font-bold tracking-widest text-accent">01</span>
        <span className="text-lg font-bold tracking-tight text-white">市场状态</span>
        <span className="text-xs text-muted">姿态 · 广度 · 风险环境</span>
      </div>
      <MarketBreadth />

      <div className="mt-14 flex items-baseline gap-3 border-t border-white/10 pt-6" data-reveal>
        <span className="font-mono text-sm font-bold tracking-widest text-accent">02</span>
        <span className="text-lg font-bold tracking-tight text-white">跨资产</span>
        <span className="text-xs text-muted">股票 · 利率 · 美元 · 商品 · 波动 · 加密</span>
      </div>
      <CrossAsset />

      <div className="mt-14 flex items-baseline gap-3 border-t border-white/10 pt-6" data-reveal>
        <span className="font-mono text-sm font-bold tracking-widest text-accent">03</span>
        <span className="text-lg font-bold tracking-tight text-white">资金与拥挤度</span>
        <span className="text-xs text-muted">COT · NAAIM · CTA</span>
      </div>
      <Positioning />
    </div>
  );
}
