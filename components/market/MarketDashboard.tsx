"use client";

import MarketBreadth from "@/components/market/MarketBreadth";
import CrossAsset from "@/components/market/CrossAsset";
import Positioning from "@/components/market/Positioning";
import ThesisDashboard from "@/components/market/ThesisDashboard";
import { useState } from "react";

/** Public market observatory. It intentionally consumes only the published
 * macro snapshots and never reads portfolio, watchlist, journal, or user data. */
export default function MarketDashboard() {
  const [tab, setTab] = useState<"overview" | "thesis">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "thesis" ? "thesis" : "overview"
  );
  return (
    <div className="pf-page">
      <header className="pf-header" data-reveal>
        <div>
          <p className="apple-eyebrow">市场观察</p>
          <h1>Market.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">公开快照与私有研究记录分开呈现。数据的更新时间和证据边界优先于结论。</p>
        </div>
      </header>
      <div className="mt-8 flex gap-6 border-b border-white/10"><button onClick={() => setTab("overview")} className={`pb-3 text-sm ${tab === "overview" ? "border-b-2 border-white text-white" : "text-muted"}`}>概览</button><button onClick={() => setTab("thesis")} className={`pb-3 text-sm ${tab === "thesis" ? "border-b-2 border-white text-white" : "text-muted"}`}>Thesis <span className="ml-1 text-xs text-muted">私有</span></button></div>
      {tab === "thesis" ? <ThesisDashboard /> : <>

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
      </>}
    </div>
  );
}
