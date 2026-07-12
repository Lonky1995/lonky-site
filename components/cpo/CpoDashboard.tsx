"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  hook,
  industry,
  walls,
  cpoIntro,
  routes,
  routeTension,
  coexistence,
  bomLayers,
  roleCards,
  supplyDemand,
  adoptionCurve,
  alphaChain,
  keyMilestones,
  earningsCalendar,
  wordingLadder,
  falsification,
  hiddenAssumptions,
  bearCase,
  riskScenarios,
  QUOTE_SYMBOLS,
  LAST_UPDATED,
  PRICE_IN_LABELS,
} from "@/data/cpo-dashboard";

type Quote = { symbol: string; price: number; changesPercentage: number; marketCap: number; pe: number | null };

const GREEN = "#4F6B52";
const RED = "#A3392F";

function fmtMktCap(v: number) {
  if (!v) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

// ── 小组件 ──────────────────────────────────────────

function SectionHead({ index, title, sub }: { index: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 mt-24 flex items-baseline gap-4 border-t-2 border-border pt-4">
      <span className="font-mono text-sm text-accent">{index}</span>
      <h2 className="text-2xl font-extrabold uppercase tracking-tight md:text-3xl">{title}</h2>
      {sub && <span className="hidden text-sm text-muted md:inline">{sub}</span>}
    </div>
  );
}

function ChangeCell({ q }: { q?: Quote }) {
  if (!q) return <span className="text-muted">—</span>;
  const neg = q.changesPercentage < 0;
  return (
    <span style={{ color: neg ? RED : GREEN }}>
      {neg ? "" : "+"}
      {q.changesPercentage?.toFixed(2)}%
    </span>
  );
}

const TONE_LABEL: Record<string, string> = {
  hero: "链主",
  throat: "咽喉",
  arms: "军火商",
  assembly: "组装",
  water: "卖水人",
};

// ── 主组件 ──────────────────────────────────────────

export default function CpoDashboard() {
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
      {/* ── 页头 + 钩子 ── */}
      <header>
        <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Link href="/" className="hover:text-accent">
            ← lonky.me
          </Link>
          <span>Narrative · {LAST_UPDATED}</span>
        </div>
        <div className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
          {industry.name} ▸ 光互连 ▸ CPO
        </div>
        <h1 className="mt-3 font-extrabold uppercase leading-[0.9] tracking-tight" style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}>
          CPO / 光互联
          <br />
          <span className="text-accent">叙事看板</span>
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed">{hook}</p>
        <div className="mt-6 flex items-center gap-2 font-mono text-xs text-muted">
          <span className="inline-block h-2 w-2" style={{ background: quoteState === "live" ? GREEN : quoteState === "off" ? RED : "var(--color-muted)" }} />
          {quoteState === "live" ? "行情实时（FMP，60s 缓存）" : quoteState === "off" ? "行情未接入" : "行情加载中"}
        </div>
      </header>

      {/* ── 01 大行业背景 ── */}
      <SectionHead index="01" title="大行业：AI 数据中心" sub="CPO 的母体 · 互连正在成为算力规模的瓶颈" />
      <p className="max-w-3xl text-lg leading-relaxed text-foreground/85">{industry.whatsHappening}</p>
      <div className="mt-8 grid grid-cols-1 border-2 border-border sm:grid-cols-3">
        {industry.macroStats.map((s, i) => (
          <div key={s.label} className={`p-5 ${i > 0 ? "border-t-2 border-border sm:border-t-0 sm:border-l-2" : ""}`}>
            <div className="font-mono text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="mt-2 text-sm leading-snug text-foreground/80">{s.label}</div>
            <div className="mt-2 font-mono text-[11px] uppercase text-muted">来源：{s.source}</div>
          </div>
        ))}
      </div>

      {/* ── 02 三堵墙 ── */}
      <SectionHead index="02" title="三堵墙" sub="为什么传统光互连撞墙了" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {walls.map((w) => (
          <div key={w.name} className="flex flex-col border-2 border-border">
            <div className="border-b-2 border-border bg-foreground px-4 py-3 text-background">
              <div className="font-mono text-xs uppercase tracking-widest opacity-70">{w.name}</div>
              <div className="mt-1 text-lg font-bold leading-tight">{w.headline}</div>
            </div>
            <p className="px-4 py-3 text-[13px] leading-snug text-foreground/75">{w.detail}</p>
            <div className="mt-auto border-t border-border/30">
              {w.data.map((d, i) => (
                <div key={d.label} className={`flex items-baseline justify-between gap-2 px-4 py-2 ${i > 0 ? "border-t border-border/20" : ""}`}>
                  <span className="shrink-0 text-[12px] text-muted">{d.label}</span>
                  <span className="min-w-0 break-words text-right font-mono text-[13px] font-bold">{d.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/30 px-4 py-2 font-mono text-[10px] uppercase text-muted">{w.source}</div>
          </div>
        ))}
      </div>

      {/* ── 03 CPO 登场 ── */}
      <SectionHead index="03" title="CPO 登场" sub="是什么 · 为什么是必经之路" />
      <div className="border-2 border-border bg-card p-6">
        <div className="font-serif text-xl leading-relaxed md:text-2xl">{cpoIntro.definition}</div>
        <div className="mt-4 flex items-start gap-3 border-t border-border/30 pt-4">
          <span className="mt-1 font-mono text-xs font-bold text-accent">解法</span>
          <span className="text-lg leading-relaxed text-foreground/85">{cpoIntro.solves}</span>
        </div>
      </div>
      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">不可或缺性 · 三个硬支撑</h3>
      <div className="space-y-4">
        {cpoIntro.indispensable.map((it, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 border-2 border-border p-5 md:grid-cols-[240px_1fr] md:gap-6">
            <div className="text-base font-bold leading-snug text-accent">{it.point}</div>
            <div className="text-[14px] leading-relaxed text-foreground/80">{it.backing}</div>
          </div>
        ))}
      </div>

      {/* ── 04 技术路线之争 ── */}
      <SectionHead index="04" title="技术路线之争" sub="现在有哪些解法 · 各自进展 · 谁会赢" />
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2.5">路线</th>
              <th className="w-[26%] px-3 py-2.5">原理</th>
              <th className="px-3 py-2.5">成熟度 / 进展</th>
              <th className="px-3 py-2.5">功耗</th>
              <th className="px-3 py-2.5">代表公司</th>
              <th className="w-[24%] px-3 py-2.5">瓶颈 / 局限</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r, i) => (
              <tr key={r.name} className={`${i > 0 ? "border-t border-border/30" : ""} ${r.isHero ? "bg-accent/10" : ""}`}>
                <td className="px-3 py-3 align-top">
                  <div className="font-bold leading-tight">
                    {r.isHero && "★ "}
                    {r.name}
                  </div>
                </td>
                <td className="px-3 py-3 align-top text-[13px] leading-snug text-foreground/75">{r.principle}</td>
                <td className="px-3 py-3 align-top text-[13px] leading-snug">{r.maturity}</td>
                <td className="px-3 py-3 align-top font-mono text-[13px] font-bold">{r.power ?? "—"}</td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-wrap gap-1">
                    {r.reps.map((t) => (
                      <span key={t} className="inline-block border border-border px-1.5 py-0.5 font-mono text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 align-top text-[13px] leading-snug text-foreground/75">{r.bottleneck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 张力点：两大链主分歧 */}
      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">{routeTension.title}</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[routeTension.broadcom, routeTension.nvidia].map((c) => (
          <div key={c.name} className="border-2 border-border p-5">
            <div className="text-lg font-bold">{c.name}</div>
            <p className="mt-2 text-[14px] leading-relaxed text-foreground/80">{c.stance}</p>
            <div className="mt-3 font-mono text-[11px] text-muted">代表产品：{c.products}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-l-4 border-accent pl-6 font-serif text-lg leading-relaxed">{routeTension.takeaway}</p>

      {/* 共存格局 */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: "赛跑时间表", text: coexistence.timeline },
          { label: "为什么共存", text: coexistence.reason },
          { label: "渗透率天花板", text: coexistence.penetration },
        ].map((c) => (
          <div key={c.label} className="border-2 border-border p-5">
            <div className="font-mono text-xs uppercase tracking-widest text-accent">{c.label}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">{c.text}</p>
          </div>
        ))}
      </div>

      {/* ── 05 产业链卡位 ── */}
      <SectionHead index="05" title="产业链卡位" sub="CPO 内部谁卡脖子 · 同链不同层 price-in 天壤之别" />
      <div className="space-y-3">
        {bomLayers.map((b) => (
          <div key={b.layer} className={`border-2 border-border p-4 ${b.key ? "bg-accent/10" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-foreground px-1.5 py-0.5 font-mono text-[11px] font-bold text-background">{b.layer}</span>
              <span className="font-bold">
                {b.key && "⭐ "}
                {b.segment}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {b.tickers.map((t) => (
                  <span key={t} className="inline-block border border-border px-1.5 py-0.5 font-mono text-[11px] font-bold">
                    {t}
                  </span>
                ))}
              </span>
              <span className="font-mono text-[11px] text-muted">可替代性：{b.replaceability}</span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px]">
                <span className="flex gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="inline-block h-2.5 w-5"
                      style={{
                        background: i <= b.priceIn ? (b.priceIn === 3 ? RED : "var(--color-accent)") : "var(--color-card)",
                        border: "1px solid var(--color-border)",
                      }}
                    />
                  ))}
                </span>
                <span style={b.priceIn === 3 ? { color: RED, fontWeight: 700 } : undefined} className={b.priceIn === 3 ? "" : "text-muted"}>
                  {PRICE_IN_LABELS[b.priceIn]}
                </span>
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-foreground/75">{b.note}</p>
          </div>
        ))}
      </div>

      {/* ── 06 角色卡片 ── */}
      <SectionHead index="06" title="谁是谁" sub="每家公司在这个故事里扮演什么" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roleCards.map((c) => {
          const q = c.hasQuote ? quotes[c.ticker] : undefined;
          return (
            <div key={c.ticker} className={`flex flex-col border-2 border-border p-5 ${c.tone === "throat" ? "bg-accent/10" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">{c.ticker}</span>
                    <span className="text-sm text-muted">{c.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="bg-foreground px-1.5 py-0.5 font-mono text-[10px] uppercase text-background">{TONE_LABEL[c.tone]}</span>
                    <span className="text-[13px] font-bold text-accent">{c.role}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono">
                  {c.hasQuote ? (
                    <>
                      <div className="text-sm font-bold">{q ? `$${q.price?.toFixed(2)}` : "—"}</div>
                      <div className="text-xs">
                        <ChangeCell q={q} />
                      </div>
                      <div className="text-[10px] text-muted">{q ? fmtMktCap(q.marketCap) : ""}</div>
                    </>
                  ) : (
                    <span className="font-mono text-[10px] uppercase text-muted">非美股 · 纯叙事</span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground/80">{c.story}</p>
            </div>
          );
        })}
      </div>

      {/* ── 07 供需缺口 ── */}
      <SectionHead index="07" title="供需缺口测算" sub={supplyDemand.subject} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border-2 border-border">
          <div className="border-b-2 border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-widest">需求侧</div>
          {supplyDemand.demandSide.map((d, i) => (
            <div key={d.label} className={`flex items-baseline justify-between gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-border/30" : ""}`}>
              <span className="text-[13px] text-foreground/75">{d.label}</span>
              <span className="shrink-0 font-mono text-sm font-bold">{d.value}</span>
            </div>
          ))}
        </div>
        <div className="border-2 border-border">
          <div className="border-b-2 border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-widest">供给侧</div>
          {supplyDemand.supplySide.map((d, i) => (
            <div key={d.label} className={`flex items-baseline justify-between gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-border/30" : ""}`}>
              <span className="text-[13px] text-foreground/75">{d.label}</span>
              <span className="shrink-0 text-right font-mono text-sm font-bold">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {supplyDemand.scenarios.map((s) => (
          <div key={s.name} className="border-2 p-5" style={{ borderColor: s.good ? GREEN : RED }}>
            <div className="flex items-center justify-between">
              <span className="font-bold" style={{ color: s.good ? GREEN : RED }}>{s.name}</span>
              <span className="font-mono text-[11px] text-muted">{s.assumption}</span>
            </div>
            <div className="mt-2 font-mono text-sm">{s.math}</div>
            <div className="mt-1 font-mono text-lg font-bold">→ {s.result}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 border-2 border-border bg-foreground p-5 font-serif text-lg leading-relaxed text-background">{supplyDemand.conclusion}</p>

      {/* ── 08 观测点 ── */}
      <SectionHead index="08" title="观测点 & 节点" sub="现在在曲线哪一段 · 看什么验证" />

      {/* 技术采用曲线 */}
      <p className="mb-4 text-[13px] leading-relaxed text-muted">
        时间维度的证伪：HBM / CoWoS / 400G 光模块都走过「发布兴奋 → 死亡谷回调 → 首笔收入 → 主升浪」。
        <span className="font-bold text-foreground"> 若股价没经过死亡谷就一路涨，那是纯情绪、不是真需求</span>——反而是危险信号。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-5">
        {adoptionCurve.map((a, i) => (
          <div
            key={a.stage}
            className={`border-2 border-border p-4 ${i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""} ${a.current ? "bg-foreground text-background" : a.danger ? "bg-accent/20" : ""}`}
          >
            <div className="text-sm font-bold leading-tight">
              {a.current && "▸ "}
              {a.stage}
            </div>
            <div className={`mt-1 font-mono text-[11px] ${a.current ? "opacity-70" : "text-muted"}`}>{a.window}</div>
            <div className={`mt-2 text-[12px] leading-snug ${a.current ? "opacity-90" : "text-foreground/70"}`}>{a.desc}</div>
            {a.current && <div className="mt-2 font-mono text-[11px] font-bold">← 当前位置</div>}
          </div>
        ))}
      </div>

      {/* 关键节点 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3">
        {keyMilestones.map((m, i) => (
          <div key={m.when} className={`border-2 border-border p-5 ${i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""}`}>
            <div className="font-mono text-xl font-bold text-accent">{m.when}</div>
            <div className="mt-2 text-sm font-semibold leading-snug">{m.what}</div>
            <div className="mt-1 font-mono text-[11px] text-muted">{m.role}</div>
          </div>
        ))}
      </div>

      {/* Alpha 传导 */}
      <div className="mt-8">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Alpha 传导路径（上游先行）</h3>
        <div className="overflow-x-auto border-2 border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5">若观察到</th>
                <th className="px-4 py-2.5">应联想到</th>
                <th className="px-4 py-2.5 text-right">时滞</th>
              </tr>
            </thead>
            <tbody>
              {alphaChain.map((a, i) => (
                <tr key={a.observe} className={i > 0 ? "border-t border-border/30" : ""}>
                  <td className="px-4 py-2.5 font-semibold">{a.observe}</td>
                  <td className="px-4 py-2.5 text-foreground/75">→ {a.infer}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{a.lag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 措辞阶梯 */}
      <div className="mt-8">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">管理层措辞阶梯 · 读 transcript 定位所处阶段</h3>
        <div className="flex flex-col md:flex-row">
          {wordingLadder.map((w, i) => (
            <div
              key={w}
              className={`flex-1 border-2 border-border px-4 py-3 text-center font-mono text-sm font-bold ${i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""} ${i === wordingLadder.length - 1 ? "bg-foreground text-background" : ""}`}
            >
              {w}
              {i < wordingLadder.length - 1 && <span className="ml-2 text-muted">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 财报日历 */}
      <div className="mt-8">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">财报日历 · 按序看：GLW → GFS → COHR → MRVL</h3>
        <div className="border-2 border-border">
          {earningsCalendar.map((e, i) => (
            <div key={e.ticker} className={`grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-[80px_150px_1fr] md:gap-4 ${i > 0 ? "border-t border-border/30" : ""}`}>
              <span className="font-mono text-sm font-bold">{e.ticker}</span>
              <span className="font-mono text-xs text-muted">{e.months}</span>
              <span className="text-[13px] leading-snug text-foreground/75">{e.watch}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 09 叙事怎样会崩 ── */}
      <SectionHead index="09" title="叙事怎样会崩" sub="证伪逻辑 · 先想会怎么错，再想能赚多少" />

      {/* 证伪信号表 */}
      <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
        证伪信号 · 每个看涨支柱，配一个「看到什么就说明我错了」
      </h3>
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="w-[22%] px-4 py-2.5">多头论点</th>
              <th className="px-4 py-2.5">证伪信号（触发即 thesis 破裂）</th>
              <th className="px-4 py-2.5">具体盯什么</th>
            </tr>
          </thead>
          <tbody>
            {falsification.map((f, i) => (
              <tr key={f.bull} className={i > 0 ? "border-t border-border/30" : ""}>
                <td className="px-4 py-3 align-top text-[13px] font-bold">{f.bull}</td>
                <td className="px-4 py-3 align-top text-[13px] leading-snug" style={{ color: RED }}>
                  {f.signal}
                </td>
                <td className="px-4 py-3 align-top text-[13px] leading-snug text-foreground/70">{f.watch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 隐藏假设 */}
      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">
        隐藏假设 · 一旦错就全盘皆错的前提
      </h3>
      <div className="space-y-4">
        {hiddenAssumptions.map((h, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 border-2 border-border p-5 md:grid-cols-[280px_1fr] md:gap-6">
            <div className="text-base font-bold leading-snug">
              <span className="font-mono text-xs text-muted">假设 {i + 1} · </span>
              {h.assumption}
            </div>
            <div className="text-[14px] leading-relaxed text-foreground/80">{h.risk}</div>
          </div>
        ))}
      </div>

      {/* 熊方叙事（红队） */}
      <div className="mt-8 border-2 border-border" style={{ borderColor: RED }}>
        <div className="border-b-2 px-4 py-3 font-bold text-background" style={{ background: RED, borderColor: RED }}>
          🐻 {bearCase.title}
        </div>
        <ul className="divide-y divide-border/30">
          {bearCase.points.map((p, i) => (
            <li key={i} className="flex gap-3 px-4 py-3 text-[14px] leading-relaxed text-foreground/85">
              <span className="shrink-0 font-mono text-sm font-bold" style={{ color: RED }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* 风险场景 */}
      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">五个风险场景 · 概率 / 触发 / 冲击 / 对冲</h3>
      <div className="border-2 border-border">
        {riskScenarios.map((r, i) => (
          <div key={r.name} className={`px-4 py-4 ${i > 0 ? "border-t border-border/30" : ""} ${r.baseline ? "bg-accent/10" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold">{r.name}</span>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-32 border border-border bg-card">
                  <div className="h-full" style={{ width: `${r.prob}%`, background: r.baseline ? GREEN : "var(--color-accent)" }} />
                </div>
                <span className="font-mono text-xs font-bold">{r.prob}%</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
              <div className="text-[13px] leading-snug text-foreground/70">
                <span className="font-mono text-[10px] uppercase text-muted">触发 · </span>
                {r.trigger}
              </div>
              <div className="text-[13px] leading-snug text-foreground/70">
                <span className="font-mono text-[10px] uppercase text-muted">冲击 · </span>
                {r.impact}
              </div>
              <div className="text-[13px] leading-snug text-foreground/70">
                <span className="font-mono text-[10px] uppercase text-muted">对冲 · </span>
                {r.hedge}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 页脚 ── */}
      <footer className="mt-24 border-t-2 border-border pt-4 font-mono text-[11px] leading-relaxed text-muted">
        <p>
          数据来源：Morgan Stanley / Bernstein / Nomura / Marvell 研报 + 公司财报 · 行情：Financial Modeling Prep（延迟约 60s）·
          方法论：半导体产业链研究框架
        </p>
        <p className="mt-2">个人研究笔记，不构成投资建议。情景概率与评分为主观判断。最后更新：{LAST_UPDATED}</p>
      </footer>
    </main>
  );
}
