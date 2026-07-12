"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  narrative,
  bomLayers,
  supplyDemand,
  scoredTickers,
  battlePlans,
  alphaChain,
  keyMilestones,
  earningsCalendar,
  wordingLadder,
  watchRoutine,
  riskScenarios,
  QUOTE_SYMBOLS,
  LAST_UPDATED,
  PRICE_IN_LABELS,
} from "@/data/cpo-dashboard";

type Quote = {
  symbol: string;
  price: number;
  changesPercentage: number;
  marketCap: number;
  pe: number | null;
};

function fmtMktCap(v: number) {
  if (!v) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

const GREEN = "#4F6B52";
const RED = "#A3392F";

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

function Stars({ n }: { n: number }) {
  return (
    <span className="font-mono text-sm tracking-tight">
      <span className="text-foreground">{"★".repeat(n)}</span>
      <span className="text-foreground/20">{"★".repeat(5 - n)}</span>
    </span>
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

function RoleChip({ role }: { role: string }) {
  const style =
    role === "主仓"
      ? "bg-foreground text-background"
      : role === "空头"
      ? "border-2 border-border"
      : role === "备选"
      ? "bg-accent/20"
      : "text-muted border border-border/40";
  return <span className={`inline-block px-2 py-0.5 font-mono text-[11px] font-bold ${style}`}>{role}</span>;
}

// 建仓档位状态：现价落在触发区间内 = 触发中
function tierStatus(direction: "多" | "空", price: number | undefined, low?: number, high?: number) {
  if (!price || (!low && !high)) return null;
  if (direction === "多") {
    if (high && price <= high && (!low || price >= low)) return "in";
    if (low && price < low) return "past";
    return "wait";
  }
  // 空：涨到区间触发
  if (low && price >= low && (!high || price <= high)) return "in";
  if (high && price > high) return "past";
  return "wait";
}

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
      {/* ── 页头 ── */}
      <header>
        <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Link href="/" className="hover:text-accent">
            ← lonky.me
          </Link>
          <span>Narrative Dossier · {LAST_UPDATED}</span>
        </div>
        <h1
          className="mt-8 font-extrabold uppercase leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}
        >
          CPO / 光互联
          <br />
          <span className="text-accent">叙事看板</span>
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-muted">
          <span>单一叙事 · 共封装光学</span>
          <span>方法论：四铁律 · 供需测算 · 技术采用曲线</span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2"
              style={{ background: quoteState === "live" ? GREEN : quoteState === "off" ? RED : "var(--color-muted)" }}
            />
            {quoteState === "live" ? "行情实时（FMP，60s 缓存）" : quoteState === "off" ? "行情未接入" : "行情加载中"}
          </span>
        </div>
      </header>

      {/* ── 01 叙事定位 ── */}
      <SectionHead index="01" title="叙事定位" sub="CPO 是什么 · 现在在技术采用曲线哪一段" />

      <blockquote className="border-l-4 border-accent pl-6 font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed">
        {narrative.oneLiner}
      </blockquote>

      {/* 市场规模 + 赛道四铁律 */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col justify-center border-2 border-border bg-foreground p-6 text-background">
          <div className="font-mono text-xs uppercase tracking-widest opacity-70">市场规模</div>
          <div className="mt-2 font-mono text-2xl font-bold">
            {narrative.market.now} → {narrative.market.future}
          </div>
          <div className="mt-1 font-mono text-lg">CAGR {narrative.market.cagr}</div>
          <div className="mt-2 font-mono text-[11px] opacity-70">{narrative.market.note}</div>
        </div>
        <div className="border-2 border-border">
          <div className="border-b-2 border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted">
            赛道级四铁律 · {narrative.lawsVerdict}
          </div>
          {narrative.laws.map((l, i) => (
            <div
              key={l.name}
              className={`flex flex-col gap-1 px-4 py-2.5 md:flex-row md:items-center md:gap-4 ${
                i > 0 ? "border-t border-border/30" : ""
              }`}
            >
              <span className="w-20 shrink-0 text-sm font-bold">{l.name}</span>
              <Stars n={l.stars} />
              <span className="text-[13px] leading-snug text-foreground/70">{l.basis}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 技术采用曲线 */}
      <div className="mt-10">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          技术采用曲线 · HBM / CoWoS / 400G 光模块都走过的路
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {narrative.adoption.map((a, i) => (
            <div
              key={a.stage}
              className={`border-2 border-border p-4 ${i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""} ${
                a.current ? "bg-foreground text-background" : a.danger ? "bg-accent/20" : ""
              }`}
            >
              <div className="text-sm font-bold leading-tight">
                {a.current && "▸ "}
                {a.stage}
              </div>
              <div className={`mt-1 font-mono text-[11px] ${a.current ? "opacity-70" : "text-muted"}`}>{a.window}</div>
              <div className={`mt-2 text-[12px] leading-snug ${a.current ? "opacity-90" : "text-foreground/70"}`}>
                {a.desc}
              </div>
              {a.current && <div className="mt-2 font-mono text-[11px] font-bold">← 当前位置</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 大事件 */}
      <div className="mt-10">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">叙事大事记</h3>
        <ul className="border-2 border-border">
          {narrative.timeline.map((t, i) => (
            <li key={i} className={`flex gap-4 px-4 py-3 ${i > 0 ? "border-t border-border/30" : ""}`}>
              <span className="shrink-0 font-mono text-xs font-bold text-accent">{t.date}</span>
              <span className="text-sm leading-snug">{t.event}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 02 产业链卡位 ── */}
      <SectionHead index="02" title="产业链卡位" sub="BOM 每层谁卡脖子 · 同链不同层 price-in 天壤之别" />
      <div className="space-y-3">
        {bomLayers.map((b) => (
          <div key={b.layer} className={`border-2 border-border p-4 ${b.key ? "bg-accent/10" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-foreground px-1.5 py-0.5 font-mono text-[11px] font-bold text-background">
                {b.layer}
              </span>
              <span className="font-bold">
                {b.key && "⭐ "}
                {b.segment}
              </span>
              <span className="space-x-1.5">
                {b.tickers.map((t) => (
                  <span key={t} className="inline-block border border-border px-1.5 py-0.5 font-mono text-[11px] font-bold">
                    {t}
                  </span>
                ))}
              </span>
              <span className="font-mono text-[11px] text-muted">可替代性：{b.replaceability}</span>
              {/* price-in 状态条 */}
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px]">
                <span className="flex gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="inline-block h-2.5 w-5"
                      style={{
                        background:
                          i <= b.priceIn
                            ? b.priceIn === 3
                              ? RED
                              : "var(--color-accent)"
                            : "var(--color-card)",
                        border: "1px solid var(--color-border)",
                      }}
                    />
                  ))}
                </span>
                <span className={b.priceIn === 3 ? "font-bold" : "text-muted"} style={b.priceIn === 3 ? { color: RED } : undefined}>
                  {PRICE_IN_LABELS[b.priceIn]}
                </span>
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-foreground/75">{b.note}</p>
          </div>
        ))}
      </div>

      {/* ── 03 供需缺口 ── */}
      <SectionHead index="03" title="供需缺口测算" sub={supplyDemand.subject} />
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
          <div key={s.name} className="border-2 border-border p-5" style={{ borderColor: s.good ? GREEN : RED }}>
            <div className="flex items-center justify-between">
              <span className="font-bold" style={{ color: s.good ? GREEN : RED }}>
                {s.name}
              </span>
              <span className="font-mono text-[11px] text-muted">{s.assumption}</span>
            </div>
            <div className="mt-2 font-mono text-sm">{s.math}</div>
            <div className="mt-1 font-mono text-lg font-bold">→ {s.result}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 border-2 border-border bg-foreground p-5 font-serif text-lg leading-relaxed text-background">
        {supplyDemand.conclusion}
      </p>

      {/* ── 04 标的打分 ── */}
      <SectionHead index="04" title="标的打分" sub="四铁律 /20 分 · 同赛道分层定位" />
      {quoteState === "off" && (
        <p className="mb-4 border-2 border-dashed border-border px-4 py-2 font-mono text-xs text-muted">
          实时行情未接入（FMP_API_KEY 未配置或请求失败），价格列显示 “—”
        </p>
      )}
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2.5">标的 / 环节</th>
              <th className="px-3 py-2.5 text-right">现价</th>
              <th className="px-3 py-2.5 text-right">日涨跌</th>
              <th className="px-3 py-2.5 text-right">市值</th>
              <th className="px-3 py-2.5 text-center">瓶颈</th>
              <th className="px-3 py-2.5 text-center">垄断</th>
              <th className="px-3 py-2.5 text-center">弹性</th>
              <th className="px-3 py-2.5 text-center">PTSD</th>
              <th className="px-3 py-2.5 text-right">总分</th>
              <th className="px-3 py-2.5">定位</th>
              <th className="w-[30%] px-3 py-2.5">判定</th>
            </tr>
          </thead>
          <tbody>
            {scoredTickers.map((t, i) => {
              const q = quotes[t.ticker];
              return (
                <tr key={t.ticker} className={`${i > 0 ? "border-t border-border/30" : ""} ${t.role === "主仓" ? "bg-accent/10" : ""}`}>
                  <td className="px-3 py-3 align-top">
                    <div className="font-mono text-base font-bold">{t.ticker}</div>
                    <div className="font-mono text-[11px] text-muted">{t.segment}</div>
                  </td>
                  <td className="px-3 py-3 text-right align-top font-mono font-bold">{q ? `$${q.price?.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-3 text-right align-top font-mono">
                    <ChangeCell q={q} />
                  </td>
                  <td className="px-3 py-3 text-right align-top font-mono text-xs text-muted">{q ? fmtMktCap(q.marketCap) : "—"}</td>
                  <td className="px-3 py-3 text-center align-top font-mono">{t.scores.bottleneck}</td>
                  <td className="px-3 py-3 text-center align-top font-mono">{t.scores.monopoly}</td>
                  <td className="px-3 py-3 text-center align-top font-mono">{t.scores.elasticity}</td>
                  <td className="px-3 py-3 text-center align-top font-mono">{t.scores.ptsd}</td>
                  <td className="px-3 py-3 text-right align-top font-mono text-base font-bold text-accent">{t.total}</td>
                  <td className="px-3 py-3 align-top">
                    <RoleChip role={t.role} />
                  </td>
                  <td className="px-3 py-3 align-top text-[13px] leading-snug text-foreground/80">
                    {t.verdict}
                    {t.reconsider && (
                      <div className="mt-1 font-mono text-[11px] text-muted">重新考虑：{t.reconsider}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 05 作战计划 ── */}
      <SectionHead index="05" title="作战计划" sub="分批触发价 · 现价自动标注当前档位" />
      <div className="space-y-8">
        {battlePlans.map((p) => {
          const q = quotes[p.ticker];
          return (
            <div key={p.ticker} className="border-2 border-border">
              <div className="flex flex-wrap items-center gap-3 border-b-2 border-border bg-card px-4 py-3">
                <span className="font-mono text-lg font-bold">{p.ticker}</span>
                <span
                  className={`px-2 py-0.5 font-mono text-[11px] font-bold ${
                    p.direction === "多" ? "bg-foreground text-background" : "border-2 border-border"
                  }`}
                >
                  做{p.direction}
                </span>
                <span className="font-mono text-xs text-muted">{p.allocation}</span>
                {q && (
                  <span className="ml-auto font-mono text-sm font-bold">
                    现价 ${q.price?.toFixed(2)} <ChangeCell q={q} />
                  </span>
                )}
              </div>
              <p className="border-b border-border/30 px-4 py-3 text-[13px] leading-snug text-foreground/75">{p.logic}</p>
              <div>
                {p.tiers.map((t, i) => {
                  const st = tierStatus(p.direction, q?.price, t.triggerLow, t.triggerHigh);
                  return (
                    <div
                      key={t.label}
                      className={`grid grid-cols-2 gap-2 px-4 py-3 md:grid-cols-[140px_150px_1fr_80px_80px] md:items-center ${
                        i > 0 ? "border-t border-border/30" : ""
                      } ${st === "in" ? "bg-accent/15" : ""}`}
                    >
                      <span className="text-sm font-bold">
                        {st === "in" && "▸ "}
                        {t.label}
                      </span>
                      <span className="font-mono text-sm">
                        {t.triggerLow && t.triggerHigh
                          ? `$${t.triggerLow}-${t.triggerHigh}`
                          : t.triggerLow
                          ? `$${t.triggerLow}+`
                          : "任何价"}
                        {st === "in" && <span className="ml-1.5 font-bold text-accent">触发中</span>}
                      </span>
                      <span className="col-span-2 text-[13px] leading-snug text-foreground/70 md:col-span-1">{t.signal}</span>
                      <span className="font-mono text-sm font-bold">{t.size}</span>
                      <span className="font-mono text-[11px] text-muted">{t.cumulative ? `累计 ${t.cumulative}` : ""}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t-2 border-border px-4 py-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">退出条件（任意一条触发）</span>
                <ul className="mt-1.5 space-y-1">
                  {p.exits.map((e) => (
                    <li key={e} className="text-[13px] leading-snug text-foreground/80">
                      · {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 06 信号与节点 ── */}
      <SectionHead index="06" title="信号与节点" sub="Alpha 在上游先行 · 看什么、什么时候看" />

      {/* 关键节点 */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {keyMilestones.map((m, i) => (
          <div key={m.when} className={`border-2 border-border p-5 ${i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""}`}>
            <div className="font-mono text-xl font-bold text-accent">{m.when}</div>
            <div className="mt-2 text-sm font-semibold leading-snug">{m.what}</div>
            <div className="mt-1 font-mono text-[11px] text-muted">{m.role}</div>
          </div>
        ))}
      </div>

      {/* 传导路径 */}
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
        <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          管理层措辞阶梯 · 读 transcript 时定位所处阶段（亲自读原文，AI 翻译丢细节）
        </h3>
        <div className="flex flex-col md:flex-row">
          {wordingLadder.map((w, i) => (
            <div
              key={w}
              className={`flex-1 border-2 border-border px-4 py-3 text-center font-mono text-sm font-bold ${
                i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""
              } ${i === wordingLadder.length - 1 ? "bg-foreground text-background" : ""}`}
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

      {/* 观测节奏 */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {watchRoutine.map((w) => (
          <div key={w.freq} className="border-2 border-border">
            <div className="border-b-2 border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest">{w.freq}</div>
            <ul className="space-y-1.5 px-4 py-3">
              {w.items.map((it) => (
                <li key={it} className="text-[13px] leading-snug text-foreground/80">
                  · {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── 07 风险场景 ── */}
      <SectionHead index="07" title="风险场景" sub="五个剧本 · 每个都有对冲动作" />
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
      <footer className="mt-20 border-t-2 border-border pt-4 font-mono text-[11px] leading-relaxed text-muted">
        <p>
          方法论：半导体产业链研究框架（四铁律 / 供需测算 / 技术采用曲线）· 数据来源：公司财报、业界共识区间 ·
          行情：Financial Modeling Prep（延迟约 60s）
        </p>
        <p className="mt-2">个人研究笔记，不构成投资建议。评分与情景概率为主观判断。最后更新：{LAST_UPDATED}</p>
      </footer>
    </main>
  );
}
