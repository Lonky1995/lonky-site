"use client";

import { useEffect, useMemo, useState } from "react";

type PublicPosition = { id: string; symbol: string; companyName?: string; direction: "long" | "short"; size: string; entryTime: number; entryPrice?: string; logic: string; plan?: string; validate: string; invalidate: string; stopLoss?: string; conviction: number; status: "active" | "closed"; lastReview?: string; };
type PortfolioSnapshot = { generatedAt: string; positions: PublicPosition[]; };

function formatDate(value?: string | number) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(date);
}
function convictionLabel(value: number) { return `${"●".repeat(Math.max(0, Math.min(5, value)))}${"○".repeat(Math.max(0, 5 - value))}`; }

function PositionRow({ position, number }: { position: PublicPosition; number: string }) {
  const isLong = position.direction === "long";
  return <article className="portfolio-row" data-reveal>
    <div className="portfolio-index" aria-hidden>{number}</div>
    <div className="portfolio-main">
      <div className="portfolio-title-row"><div><h2>{position.symbol}</h2>{position.companyName && <p className="portfolio-company">{position.companyName}</p>}</div><span className={`portfolio-side ${isLong ? "is-long" : "is-short"}`}>{isLong ? "LONG" : "SHORT"}</span></div>
      <div className="portfolio-stats" aria-label={`${position.symbol} position details`}>
        <div><span>数量</span><strong>{position.size}</strong></div><div><span>入场</span><strong>{position.entryPrice ? `$${position.entryPrice}` : "未记录"}</strong></div><div><span>信念</span><strong className="portfolio-conviction">{convictionLabel(position.conviction)}</strong></div><div><span>记录时间</span><strong>{formatDate(position.entryTime)}</strong></div>
      </div>
    </div>
    <div className="portfolio-thesis"><section><p className="portfolio-label">THESIS</p><p>{position.logic}</p></section><section className="portfolio-check is-validate"><p className="portfolio-label">验证</p><p>{position.validate}</p></section><section className="portfolio-check is-invalidate"><p className="portfolio-label">证伪</p><p>{position.invalidate}</p></section></div>
  </article>;
}

export default function PublicPortfolio() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => { fetch(`/data/portfolio-latest.json?t=${Date.now()}`).then((response) => response.ok ? response.json() : Promise.reject(new Error("snapshot unavailable"))).then((data: PortfolioSnapshot) => { setSnapshot(data); setState("ready"); }).catch(() => setState("unavailable")); }, []);
  const activePositions = useMemo(() => (snapshot?.positions ?? []).filter((position) => position.status === "active"), [snapshot]);
  return <main className="portfolio-page">
    <header className="portfolio-hero" data-reveal><div><p className="apple-eyebrow">Public position ledger</p><h1>持仓不是结论。<br />它必须接受验证。</h1></div><div className="portfolio-hero-note"><span className="portfolio-live-dot" aria-hidden /><p>公开记录 · 用户自主录入</p><time dateTime={snapshot?.generatedAt}>更新：{formatDate(snapshot?.generatedAt)}</time></div></header>
    <div className="portfolio-rule" data-reveal><span>ACTIVE POSITIONS</span><strong>{state === "ready" ? String(activePositions.length).padStart(2, "0") : "—"}</strong></div>
    {state === "loading" && <div className="portfolio-status" data-reveal>正在读取公开持仓快照…</div>}
    {state === "unavailable" && <div className="portfolio-status" data-reveal>当前尚未发布公开快照。数据源会在下一次仓位变动或同步后更新。</div>}
    {state === "ready" && activePositions.length === 0 && <div className="portfolio-status" data-reveal>当前没有公开的活动仓位。</div>}
    {activePositions.map((position, index) => <PositionRow key={position.id} position={position} number={String(index + 1).padStart(2, "0")} />)}
    <footer className="portfolio-footer" data-reveal><p>账本保存的是入场信息与当时的判断，不代表实时券商余额、成交状态或未来操作。</p><p>每一条持仓都应以验证与证伪条件被后续事实检验。</p></footer>
  </main>;
}
