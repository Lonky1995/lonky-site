"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  narrative,
  moneyFlow,
  chains,
  watchlist,
  signals,
  QUOTE_SYMBOLS,
  LAST_UPDATED,
  type IronLaws,
} from "@/data/aidc-dashboard";

type Quote = {
  symbol: string;
  price: number;
  changesPercentage: number;
  marketCap: number;
  pe: number | null;
};

const LAW_LABELS: { key: keyof IronLaws; label: string }[] = [
  { key: "bottleneck", label: "瓶颈" },
  { key: "monopoly", label: "垄断" },
  { key: "elasticity", label: "弹性" },
  { key: "ptsd", label: "PTSD" },
];

function fmtMktCap(v: number) {
  if (!v) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

function daysUntil(iso?: string) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : null;
}

// ── 小组件 ──────────────────────────────────────────

function SectionHead({ index, title, sub }: { index: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 mt-20 flex items-baseline gap-4 border-t-2 border-border pt-4">
      <span className="font-mono text-sm text-accent">{index}</span>
      <h2 className="text-2xl font-extrabold uppercase tracking-tight md:text-3xl">{title}</h2>
      {sub && <span className="hidden text-sm text-muted md:inline">{sub}</span>}
    </div>
  );
}

function LawSquares({ score }: { score: 0 | 1 | 2 }) {
  return (
    <span className="font-mono text-[13px] tracking-tighter">
      <span className={score >= 1 ? "text-foreground" : "text-foreground/20"}>■</span>
      <span className={score >= 2 ? "text-foreground" : "text-foreground/20"}>■</span>
    </span>
  );
}

function ChangeCell({ q }: { q?: Quote }) {
  if (!q) return <span className="text-muted">—</span>;
  const neg = q.changesPercentage < 0;
  return (
    <span className={neg ? "text-[#A3392F]" : "text-[#4F6B52]"}>
      {neg ? "" : "+"}
      {q.changesPercentage?.toFixed(2)}%
    </span>
  );
}

// ── 主组件 ──────────────────────────────────────────

export default function AidcDashboard() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoteState, setQuoteState] = useState<"loading" | "live" | "off">("loading");

  useEffect(() => {
    fetch(`/api/dashboard/quotes?symbols=${QUOTE_SYMBOLS.join(",")}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { quotes: Quote[] }) => {
        const map: Record<string, Quote> = {};
        for (const q of d.quotes) map[q.symbol] = q;
        setQuotes(map);
        setQuoteState("live");
      })
      .catch(() => setQuoteState("off"));
  }, []);

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-8">
      {/* ── 页头 ── */}
      <header>
        <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Link href="/" className="hover:text-accent">
            ← lonky.me
          </Link>
          <span>Research Dossier · {LAST_UPDATED}</span>
        </div>
        <h1
          className="mt-8 font-extrabold uppercase leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}
        >
          AI Datacenter
          <br />
          <span className="text-accent">产业链看板</span>
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-muted">
          <span>主线：光互联/CPO ＋ 电力基础设施</span>
          <span>方法论：四铁律 · 三问 · 投资时间链条</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 ${
                quoteState === "live" ? "bg-[#4F6B52]" : quoteState === "off" ? "bg-[#A3392F]" : "bg-muted"
              }`}
            />
            {quoteState === "live" ? "行情实时（FMP，60s 缓存）" : quoteState === "off" ? "行情未接入" : "行情加载中"}
          </span>
        </div>
      </header>

      {/* ── 01 叙事总览 ── */}
      <SectionHead index="01" title="叙事总览" sub="现在在周期哪个位置" />

      {/* 阶段刻度 */}
      <div className="border-2 border-border">
        <div className="flex border-b-2 border-border">
          {narrative.stages.map((s, i) => (
            <div
              key={s}
              className={`flex-1 px-3 py-2 font-mono text-xs uppercase ${
                i < narrative.stages.length - 1 ? "border-r-2 border-border" : ""
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="relative h-8 overflow-hidden bg-card">
          <div className="absolute inset-y-0 left-0 bg-accent/25" style={{ width: `${narrative.stagePosition}%` }} />
          <div className="absolute inset-y-0 w-[3px] bg-accent" style={{ left: `${narrative.stagePosition}%` }} />
        </div>
      </div>
      <p className="mt-3 font-mono text-sm font-bold">当前 ▸ {narrative.stageLabel}</p>
      <p className="mt-1 font-mono text-xs text-muted">{narrative.stageAnalogy}</p>

      {/* 核心论点 */}
      <blockquote className="mt-10 border-l-4 border-accent pl-6 font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed">
        {narrative.thesis}
        <footer className="mt-3 font-mono text-xs text-muted">— {narrative.thesisSource}</footer>
      </blockquote>

      {/* 宏观数据 */}
      <div className="mt-10 grid grid-cols-1 border-2 border-border sm:grid-cols-2 lg:grid-cols-4">
        {narrative.macroStats.map((s, i) => (
          <div
            key={s.label}
            className={`p-5 ${i > 0 ? "border-t-2 border-border sm:border-t-0 sm:border-l-2" : ""} ${
              i === 2 ? "sm:border-t-2 lg:border-t-0" : ""
            } ${i === 3 ? "sm:border-t-2 lg:border-t-0" : ""}`}
          >
            <div className="font-mono text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="mt-2 text-sm leading-snug text-foreground/80">{s.label}</div>
            <div className="mt-2 font-mono text-[11px] uppercase text-muted">来源：{s.source}</div>
          </div>
        ))}
      </div>

      {/* 投资时间链条 */}
      <div className="mt-10">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          投资时间链条 · 按市场已反映程度排序
        </h3>
        <div className="flex flex-col gap-0 md:flex-row">
          {narrative.priceInChain.map((p, i) => (
            <div key={p.name} className="flex md:flex-1">
              <div
                className={`flex-1 border-2 border-border px-4 py-3 ${
                  i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""
                } ${p.status === "已部分反映" ? "bg-card" : p.status === "正在反映" ? "bg-accent/15" : ""}`}
              >
                <div className="text-sm font-bold">{p.name}</div>
                <div className="font-mono text-[11px] text-muted">{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 大事件时间线 */}
      <div className="mt-10">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">大事件时间线</h3>
        <ul className="border-2 border-border">
          {narrative.timeline.map((t, i) => (
            <li
              key={i}
              className={`flex gap-4 px-4 py-3 ${i > 0 ? "border-t border-border/30" : ""}`}
            >
              <span className="shrink-0 font-mono text-xs font-bold text-accent">{t.date}</span>
              <span className="text-sm leading-snug">{t.event}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 02 资金流 ── */}
      <SectionHead index="02" title="资金流" sub="钱流向哪个环节" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        {/* 源头 */}
        <div className="flex flex-col justify-center border-2 border-border bg-foreground p-6 text-background">
          <div className="font-mono text-xs uppercase tracking-widest opacity-70">资金源头</div>
          <div className="mt-2 font-mono text-3xl font-bold">{moneyFlow.source.value}</div>
          <div className="mt-1 text-sm">{moneyFlow.source.label}</div>
          <div className="mt-2 font-mono text-[11px] opacity-70">{moneyFlow.source.note}</div>
        </div>
        {/* 分支 */}
        <div className="space-y-6">
          {moneyFlow.branches.map((b) => (
            <div key={b.label} className="border-2 border-border">
              <div className="border-b-2 border-border bg-card px-4 py-3">
                <span className="font-bold">{b.label}</span>
                <span className="ml-3 font-mono text-[11px] text-muted">{b.note}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {b.children.map((c, i) => (
                  <div
                    key={c.label}
                    className={`px-4 py-3 ${i % 2 === 1 ? "sm:border-l border-border/30" : ""} ${
                      i >= 2 ? "border-t border-border/30" : i === 1 ? "border-t border-border/30 sm:border-t-0" : ""
                    } ${c.label.includes("本看板主线") ? "bg-accent/10" : ""}`}
                  >
                    <div className="text-sm font-semibold">{c.label}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted">{c.note}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 03 产业链地图 ── */}
      <SectionHead index="03" title="产业链地图" sub="每个环节谁有定价权 · 四铁律 0-2 分" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {chains.map((chain) => (
          <div key={chain.name}>
            <div className="mb-4 border-2 border-border bg-foreground px-4 py-3 text-background">
              <div className="font-bold uppercase">{chain.name}</div>
              <div className="mt-0.5 font-mono text-[11px] opacity-70">{chain.flow}</div>
            </div>
            <div>
              {chain.nodes.map((n, i) => {
                const total = n.laws.bottleneck + n.laws.monopoly + n.laws.elasticity + n.laws.ptsd;
                return (
                  <div key={n.segment}>
                    {i > 0 && (
                      <div className="py-1 text-center font-mono text-xs text-muted">↓ 上游</div>
                    )}
                    <div className={`border-2 border-border p-4 ${total >= 7 ? "bg-accent/10" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold">{n.segment}</span>
                          <span className="ml-3 space-x-1.5">
                            {n.tickers.map((t) => (
                              <span
                                key={t}
                                className="inline-block border border-border px-1.5 py-0.5 font-mono text-[11px] font-bold"
                              >
                                {t}
                              </span>
                            ))}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-bold text-accent">{total}/8</span>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border/30 pt-3">
                        {LAW_LABELS.map((l) => (
                          <div key={l.key} className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-muted">{l.label}</span>
                            <LawSquares score={n.laws[l.key]} />
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[13px] leading-snug text-foreground/75">{n.basis}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 04 标的追踪 ── */}
      <SectionHead index="04" title="标的追踪" sub="逻辑还成立吗 · 价格与催化剂错配一眼可见" />
      {quoteState === "off" && (
        <p className="mb-4 border-2 border-dashed border-border px-4 py-2 font-mono text-xs text-muted">
          实时行情未接入（FMP_API_KEY 未配置或请求失败），价格列显示 “—”
        </p>
      )}
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2.5">标的</th>
              <th className="px-3 py-2.5 text-right">现价</th>
              <th className="px-3 py-2.5 text-right">日涨跌</th>
              <th className="px-3 py-2.5 text-right">市值 / PE</th>
              <th className="w-[28%] px-3 py-2.5">买入逻辑</th>
              <th className="w-[20%] px-3 py-2.5">催化剂 / 验证节点</th>
              <th className="w-[20%] px-3 py-2.5">操作纪律</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((w, i) => {
              const q = quotes[w.ticker];
              const dd = daysUntil(w.catalystDate);
              return (
                <tr key={w.ticker} className={i > 0 ? "border-t border-border/30" : ""}>
                  <td className="px-3 py-3 align-top">
                    <div className="font-mono text-base font-bold">{w.ticker}</div>
                    <div className="font-mono text-[11px] text-muted">
                      {w.chain} · {w.segment}
                    </div>
                    {w.position && (
                      <div className="mt-1 inline-block bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
                        {w.position}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right align-top font-mono font-bold">
                    {q ? `$${q.price?.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right align-top font-mono">
                    <ChangeCell q={q} />
                  </td>
                  <td className="px-3 py-3 text-right align-top font-mono text-xs text-muted">
                    {q ? fmtMktCap(q.marketCap) : "—"}
                    <br />
                    {q?.pe ? `PE ${q.pe.toFixed(1)}` : ""}
                  </td>
                  <td className="px-3 py-3 align-top text-[13px] leading-snug text-foreground/80">{w.thesis}</td>
                  <td className="px-3 py-3 align-top text-[13px] leading-snug">
                    {w.catalyst}
                    {dd && <div className="mt-1 font-mono text-[11px] font-bold text-accent">T-{dd} 天</div>}
                  </td>
                  <td className="px-3 py-3 align-top text-[13px] leading-snug text-foreground/80">{w.discipline}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 05 信号看板 ── */}
      <SectionHead index="05" title="信号看板" sub="接下来看什么来验证判断" />
      <div className="border-2 border-border">
        {signals.map((s, i) => (
          <div
            key={i}
            className={`grid grid-cols-1 gap-2 px-4 py-4 md:grid-cols-[90px_1fr_1fr_1fr] md:gap-4 ${
              i > 0 ? "border-t border-border/30" : ""
            }`}
          >
            <div className="font-mono text-xs">
              <span
                className={
                  s.status === "confirmed"
                    ? "text-[#4F6B52]"
                    : s.status === "failed"
                    ? "text-[#A3392F]"
                    : "text-accent"
                }
              >
                {s.status === "confirmed" ? "■ 已兑现" : s.status === "failed" ? "■ 证伪" : "□ 待验证"}
              </span>
              {s.due && <div className="mt-1 text-muted">{s.due}</div>}
            </div>
            <div className="text-sm font-semibold leading-snug">{s.signal}</div>
            <div className="text-[13px] leading-snug text-foreground/70">
              <span className="font-mono text-[10px] uppercase text-muted">验证 · </span>
              {s.method}
            </div>
            <div className="text-[13px] leading-snug text-foreground/70">
              <span className="font-mono text-[10px] uppercase text-muted">动作 · </span>
              {s.action}
            </div>
          </div>
        ))}
      </div>

      {/* ── 页脚 ── */}
      <footer className="mt-20 border-t-2 border-border pt-4 font-mono text-[11px] leading-relaxed text-muted">
        <p>
          方法论：半导体产业链研究框架（四铁律：瓶颈/垄断/库存弹性/扩产PTSD）· 数据来源：公司财报、TrendForce、
          中金研究院、Goldman Sachs · 行情：Financial Modeling Prep（延迟约 60s）
        </p>
        <p className="mt-2">个人研究笔记，不构成投资建议。评分为主观判断。最后更新：{LAST_UPDATED}</p>
      </footer>
    </main>
  );
}
