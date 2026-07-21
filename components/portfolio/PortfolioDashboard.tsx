"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioData, Position, WatchItem } from "@/data/portfolio";
import { quoteKind } from "@/data/portfolio";
import AddPositionModal from "./AddPositionModal";
import CashModal from "./CashModal";
import ClosePositionModal from "./ClosePositionModal";
import BriefsPanel from "./BriefsPanel";
import JournalPanel from "./JournalPanel";
import CalendarPanel from "./CalendarPanel";

type Quote = { symbol: string; price: number; changesPercentage: number };

const PIE_COLORS = ["#a8b4ff", "#7f90ff", "#5c6bc0", "#94a3b8", "#64748b", "#475569"];

const FLAG_META = {
  event: { label: "本周事件", cls: "border-blue-500/40 text-blue-500" },
  risk: { label: "有风险", cls: "border-amber-500/40 text-amber-500" },
  validate: { label: "待验证", cls: "border-violet-500/40 text-violet-500" },
  todo: { label: "待跟进", cls: "border-muted text-muted" },
} as const;

const WATCH_META = {
  event: { label: "事件", cls: "border-blue-500/40 text-blue-500" },
  validate: { label: "验证", cls: "border-violet-500/40 text-violet-500" },
  risk: { label: "风险", cls: "border-amber-500/40 text-amber-500" },
  todo: { label: "跟进", cls: "border-muted text-muted" },
} as const;

function num(s?: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pnlPct(p: Position, price: number | null): number | null {
  const entry = num(p.entryPrice);
  if (entry === null || price === null || entry === 0) return null;
  const raw = ((price - entry) / entry) * 100;
  return p.direction === "long" ? raw : -raw;
}

// 数量（股/币数）
function qtyOf(p: Position): number | null {
  return num(p.size);
}
// 持仓成本 = 数量 × 入场价
function costOf(p: Position): number | null {
  const q = qtyOf(p);
  const entry = num(p.entryPrice);
  if (q === null || entry === null) return null;
  return q * entry;
}
// 市值 = 数量 × 现价
function marketValueOf(p: Position, price: number | null): number | null {
  const q = qtyOf(p);
  if (q === null || price === null) return null;
  return q * price;
}
// 盈亏额（美元）= (现价 - 入场价) × 数量，做空取反
function pnlAbs(p: Position, price: number | null): number | null {
  const q = qtyOf(p);
  const entry = num(p.entryPrice);
  if (q === null || entry === null || price === null) return null;
  const raw = (price - entry) * q;
  return p.direction === "long" ? raw : -raw;
}
function fmtUsd(v: number | null): string {
  if (v === null) return "—";
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function PortfolioDashboard() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoteState, setQuoteState] = useState<"loading" | "live" | "off">("loading");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const eqRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const [eqW, setEqW] = useState(0);
  const [pieW, setPieW] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [closeFor, setCloseFor] = useState<string | null>(null);
  const [journalFor, setJournalFor] = useState<Record<string, boolean>>({});

  const loadData = () => {
    fetch(`/data/portfolio-latest.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PortfolioData) => setData(d))
      .catch(() => setData({ generatedAt: "", positions: [], watchlist: [], equityCurve: [] }));
  };

  useEffect(() => {
    const measure = () => {
      if (eqRef.current) setEqW(eqRef.current.clientWidth);
      if (pieRef.current) setPieW(pieRef.current.clientWidth);
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [data]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!data || data.positions.length === 0) return;
    const symbols = Array.from(new Set(data.positions.map((p) => p.symbol.toUpperCase())));
    fetch(`/api/portfolio/quotes?symbols=${symbols.join(",")}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { quotes: Quote[] }) => {
        const map: Record<string, Quote> = {};
        for (const q of d.quotes) map[q.symbol.toUpperCase()] = q;
        setQuotes(map);
        setQuoteState("live");
      })
      .catch(() => setQuoteState("off"));
  }, [data]);

  const positions = data?.positions ?? [];

  const priceOf = (sym: string): number | null => {
    const q = quotes[sym.toUpperCase()];
    return q ? q.price : null;
  };

  const totalPnl = useMemo(() => {
    const vals = positions.map((p) => pnlPct(p, priceOf(p.symbol))).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [positions, quotes]);

  const longCount = positions.filter((p) => p.direction === "long").length;
  const shortCount = positions.filter((p) => p.direction === "short").length;

  // 组合汇总：总成本 / 估算市值 / 浮动盈亏 / 盈亏比例
  const summary = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    let hasCost = false;
    let hasValue = false;
    for (const p of positions) {
      const c = costOf(p);
      const v = marketValueOf(p, priceOf(p.symbol));
      if (c !== null) {
        totalCost += c;
        hasCost = true;
      }
      if (v !== null) {
        totalValue += v;
        hasValue = true;
      }
    }
    const pnl = hasCost && hasValue ? totalValue - totalCost : null;
    const pnlPctVal = pnl !== null && totalCost > 0 ? (pnl / totalCost) * 100 : null;
    const cash = data?.cash ?? 0;
    // 总资产 = 估算持仓市值 + 现金（无市值时退回成本，仍加现金）
    const assetBase = hasValue ? totalValue : hasCost ? totalCost : null;
    const totalAssets = assetBase !== null || cash > 0 ? (assetBase ?? 0) + cash : null;
    return {
      totalCost: hasCost ? totalCost : null,
      totalValue: hasValue ? totalValue : null,
      pnl,
      pnlPct: pnlPctVal,
      cash,
      totalAssets,
    };
  }, [positions, quotes, data]);

  // 单仓市值（用于占比）
  const mvBySymbol = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of positions) {
      const v = marketValueOf(p, priceOf(p.symbol));
      if (v !== null) m[p.id] = v;
    }
    return m;
  }, [positions, quotes]);
  const totalMv = Object.values(mvBySymbol).reduce((a, b) => a + b, 0);

  const watchBySymbol = useMemo(() => {
    const m: Record<string, WatchItem[]> = {};
    for (const w of data?.watchlist ?? []) {
      (m[w.symbol.toUpperCase()] ??= []).push(w);
    }
    return m;
  }, [data]);

  const needAttention = useMemo(() => {
    return new Set((data?.watchlist ?? []).map((w) => w.symbol.toUpperCase())).size;
  }, [data]);

  const pieData = useMemo(() => {
    return positions.map((p) => {
      // 优先用市值占比；拿不到行情时退回数量，保证饼图仍有分片
      const mv = mvBySymbol[p.id];
      return { name: p.symbol, value: mv ?? num(p.size) ?? 1 };
    });
  }, [positions, mvBySymbol]);

  return (
    <div className="pf-page">
      <header className="pf-header" data-reveal>
        <div className="pf-header-row">
          <div>
            <p className="apple-eyebrow">组合追踪器</p>
            <h1>Portfolio.</h1>
            <div className="pf-status">
              <span
                className="pf-status-dot"
                style={{
                  background:
                    quoteState === "live"
                      ? "var(--gain)"
                      : quoteState === "off"
                        ? "var(--loss)"
                        : "rgba(255,255,255,0.4)",
                }}
              />
              {quoteState === "live"
                ? "行情实时（FMP + Binance）"
                : quoteState === "off"
                  ? "行情未接入，PNL 暂不可用"
                  : "行情加载中"}
              <span style={{ opacity: 0.5 }}>
                · {data?.generatedAt ? data.generatedAt.slice(0, 10) : "—"}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => setAddOpen(true)} className="primary-button">
            + 记录持仓
          </button>
        </div>
      </header>

      {/* ── 概览 KPI ── */}
      <div className="pf-kpi-grid" data-reveal>
        {[
          { label: "持仓", value: String(positions.length) },
          { label: "多 / 空", value: `${longCount} / ${shortCount}` },
          {
            label: "总浮盈",
            value: totalPnl === null ? "—" : `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(1)}%`,
            accent: totalPnl,
          },
          { label: "本周需关注", value: String(needAttention) },
        ].map((s) => (
          <div key={s.label} className="pf-kpi">
            <div className="pf-kpi-label">{s.label}</div>
            <div
              className={`pf-kpi-value ${typeof s.accent === "number" ? (s.accent >= 0 ? "gain" : "loss") : ""}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── 总资产 ── */}
      <div className="mt-8 flex items-center justify-between" data-reveal>
        <p className="pf-panel-title" style={{ margin: 0 }}>
          资产总览
        </p>
        <button type="button" onClick={() => setCashOpen(true)} className="secondary-button" style={{ minHeight: 36, fontSize: "0.8rem" }}>
          {summary.cash > 0 ? "编辑现金" : "+ 设置现金"}
        </button>
      </div>
      <div className="pf-kpi-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} data-reveal>
        {[
          { label: "持仓市值", value: fmtUsd(summary.totalValue) },
          { label: "现金", value: fmtUsd(summary.cash) },
          { label: "总资产", value: fmtUsd(summary.totalAssets) },
        ].map((s) => (
          <div key={s.label} className="pf-kpi">
            <div className="pf-kpi-label">{s.label}</div>
            <div className="pf-kpi-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── 组合汇总 ── */}
      <div className="pf-kpi-grid mt-4" data-reveal>
        {[
          { label: "总成本", value: fmtUsd(summary.totalCost) },
          { label: "估算市值", value: fmtUsd(summary.totalValue) },
          { label: "浮动盈亏", value: fmtUsd(summary.pnl), accent: summary.pnl },
          {
            label: "盈亏比例",
            value:
              summary.pnlPct === null
                ? "—"
                : `${summary.pnlPct >= 0 ? "+" : ""}${summary.pnlPct.toFixed(1)}%`,
            accent: summary.pnlPct,
          },
        ].map((s) => (
          <div key={s.label} className="pf-kpi">
            <div className="pf-kpi-label">{s.label}</div>
            <div
              className={`pf-kpi-value ${typeof s.accent === "number" ? (s.accent >= 0 ? "gain" : "loss") : ""}`}
              style={{ fontSize: "1.35rem" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── 净值曲线 + 分布 ── */}
      <div className="pf-charts" data-reveal>
        <div ref={eqRef} className="pf-panel min-w-0">
          <div className="pf-panel-title">资产净值</div>
          {eqW > 0 && (
            <AreaChart width={eqW - 44} height={200} data={data?.equityCurve ?? []}>
              <defs>
                <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a8b4ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#a8b4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fontSize: 11, fill: "rgba(245,247,251,0.45)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "rgba(245,247,251,0.45)" }} axisLine={false} tickLine={false} width={36} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  background: "rgba(9,11,17,0.92)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  color: "#f5f7fb",
                }}
              />
              <Area type="monotone" dataKey="v" stroke="#a8b4ff" strokeWidth={2} fill="url(#eqFill)" />
            </AreaChart>
          )}
        </div>
        <div ref={pieRef} className="pf-panel min-w-0">
          <div className="pf-panel-title">持仓分布</div>
          {pieW > 0 && (
            <PieChart width={pieW - 44} height={160}>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  background: "rgba(9,11,17,0.92)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  color: "#f5f7fb",
                }}
              />
            </PieChart>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "rgba(245,247,251,0.55)" }}>
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 持仓卡片 ── */}
      <div className="mt-12 pf-panel-title">持仓 · 点击展开</div>
      <div className="mt-3 space-y-3">
        {positions.map((p) => {
          const price = priceOf(p.symbol);
          const pnl = pnlPct(p, price);
          const mv = mvBySymbol[p.id] ?? null;
          const pnlUsd = pnlAbs(p, price);
          const weight = mv !== null && totalMv > 0 ? (mv / totalMv) * 100 : null;
          const isOpen = expanded[p.id];
          const flags = watchBySymbol[p.symbol.toUpperCase()]?.map((w) => w.type) ?? [];
          const uniqFlags = Array.from(new Set(flags));
          return (
            <div key={p.id} className="pf-panel" style={{ marginTop: 0, padding: 0, overflow: "hidden" }}>
              <button
                onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
                className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-white/[0.03]"
                aria-expanded={isOpen}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-lg font-bold">{p.symbol}</span>
                    {p.companyName && (
                      <span className="truncate text-xs text-muted" title={p.companyName}>
                        {p.companyName}
                      </span>
                    )}
                    <span className="pf-chip">{p.direction === "long" ? "做多" : "做空"}</span>
                    <span className="shrink-0 text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
                      {p.size}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "rgba(245,247,251,0.5)" }}>
                      {p.entryPrice ?? "—"} → {price !== null ? price.toLocaleString() : "…"}
                    </span>
                    <span
                      className="min-w-[52px] text-right font-bold"
                      style={{
                        color:
                          pnl === null
                            ? "rgba(245,247,251,0.45)"
                            : pnl >= 0
                              ? "var(--gain)"
                              : "var(--loss)",
                      }}
                    >
                      {pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: "rgba(245,247,251,0.5)" }}>
                  <span>
                    市值 <span style={{ color: "rgba(245,247,251,0.85)" }}>{fmtUsd(mv)}</span>
                  </span>
                  <span>
                    盈亏{" "}
                    <span
                      style={{
                        color:
                          pnlUsd === null
                            ? undefined
                            : pnlUsd >= 0
                              ? "var(--gain)"
                              : "var(--loss)",
                      }}
                    >
                      {fmtUsd(pnlUsd)}
                    </span>
                  </span>
                  <span>
                    占比{" "}
                    <span style={{ color: "rgba(245,247,251,0.85)" }}>
                      {weight === null ? "—" : `${weight.toFixed(0)}%`}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm" style={{ color: "rgba(245,247,251,0.72)" }}>
                    <span style={{ color: "rgba(245,247,251,0.45)" }}>想法：</span>
                    {p.logic}
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5">
                    {uniqFlags.map((f) => (
                      <span key={f} className="pf-chip">
                        {FLAG_META[f].label}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/10 p-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4 text-xs md:grid-cols-4">
                    <Field label="开仓时间" value={new Date(p.entryTime).toLocaleDateString("zh-CN")} />
                    <Field label="入场价" value={p.entryPrice ?? "—"} />
                    <Field label="止损位" value={p.stopLoss ?? "—"} valueClass="text-[var(--loss)]" />
                    <Field
                      label="信念度"
                      value={"●".repeat(p.conviction) + "○".repeat(5 - p.conviction)}
                      valueClass="tracking-widest text-white/80"
                    />
                  </div>
                  <div className="mt-4 space-y-4 text-sm leading-relaxed">
                    <Block label="开仓逻辑" text={p.logic} />
                    {p.plan && <Block label="开仓计划" text={p.plan} />}
                    <Block label="✅ 验证信号（对了）" text={p.validate} />
                    <Block label="❌ 证伪信号（错了）" text={p.invalidate} />
                    {p.lastReview && (
                      <div className="border-t border-white/10 pt-3 text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>
                        ↺ {p.lastReview}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <button
                      onClick={() => setJournalFor((s) => ({ ...s, [p.id]: !s[p.id] }))}
                      className="text-xs uppercase tracking-widest text-white/70 hover:text-white"
                    >
                      {journalFor[p.id] ? "▾" : "▸"} 追踪日记 · {p.symbol}
                    </button>
                    <button
                      onClick={() => setCloseFor(p.symbol)}
                      className="border border-[var(--loss)]/40 px-3 py-1.5 text-[11px] uppercase tracking-widest text-[var(--loss)] transition-colors hover:bg-[var(--loss)]/10"
                    >
                      平仓
                    </button>
                    {journalFor[p.id] && (
                      <div className="mt-4">
                        <JournalPanel lockedSymbol={p.symbol} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 本周关注清单 ── */}
      <div className="mt-12 pf-panel-title">本周关注清单</div>
      <div className="pf-panel mt-3" style={{ padding: 0 }}>
        {(data?.watchlist ?? []).map((w, i) => {
          const m = WATCH_META[w.type];
          return (
            <div
              key={i}
              className={`flex gap-3 p-4 ${i > 0 ? "border-t border-white/10" : ""}`}
            >
              <span className="pf-chip">{m.label}</span>
              <div className="text-sm leading-relaxed" style={{ color: "rgba(245,247,251,0.85)" }}>
                <span className="font-bold">{w.symbol}</span> · {w.text}
              </div>
            </div>
          );
        })}
        {(data?.watchlist ?? []).length === 0 && (
          <div className="p-4 text-sm" style={{ color: "rgba(245,247,251,0.5)" }}>
            暂无关注清单，每周日晚 coach 会生成。
          </div>
        )}
      </div>

      <div className="mt-12 pf-panel-title">动态简报</div>
      <div className="mt-3">
        <BriefsPanel />
      </div>

      <div className="mt-12 pf-panel-title">重点日历</div>
      <div className="mt-3">
        <CalendarPanel />
      </div>

      <AddPositionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          // 网站 JSON 经 GitHub→Vercel 部署有延迟，稍等后重拉
          setTimeout(loadData, 3000);
        }}
      />

      <CashModal
        open={cashOpen}
        current={data?.cash ?? null}
        onClose={() => setCashOpen(false)}
        onSuccess={() => {
          // 现金写入后经 GitHub→Vercel 部署有延迟，稍等后重拉
          setTimeout(loadData, 3000);
        }}
      />

      <ClosePositionModal
        open={closeFor !== null}
        symbol={closeFor}
        onClose={() => setCloseFor(null)}
        onSuccess={() => {
          // 平仓后经 GitHub→Vercel 部署有延迟，稍等后重拉
          setTimeout(loadData, 3000);
        }}
      />
    </div>
  );
}

function Field({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase" style={{ color: "rgba(245,247,251,0.45)" }}>
        {label}
      </div>
      <div className={`mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="pf-chip">{label}</span>
      <p className="mt-2" style={{ color: "rgba(245,247,251,0.85)" }}>
        {text}
      </p>
    </div>
  );
}
