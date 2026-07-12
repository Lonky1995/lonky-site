"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

type Quote = { symbol: string; price: number; changesPercentage: number };

const PIE_COLORS = ["#2a78d6", "#1baf7a", "#eda100", "#e34948", "#4a3aa7", "#e87ba4"];

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

export default function PortfolioDashboard() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoteState, setQuoteState] = useState<"loading" | "live" | "off">("loading");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const eqRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const [eqW, setEqW] = useState(0);
  const [pieW, setPieW] = useState(0);

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
    fetch("/data/portfolio-latest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PortfolioData) => setData(d))
      .catch(() => setData({ generatedAt: "", positions: [], watchlist: [], equityCurve: [] }));
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
      const size = num(p.size) ?? 1;
      return { name: p.symbol, value: size };
    });
  }, [positions]);

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-8">
      <header>
        <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Link href="/" className="hover:text-accent">
            ← lonky.me
          </Link>
          <span>Portfolio · {data?.generatedAt ? data.generatedAt.slice(0, 10) : "—"}</span>
        </div>
        <div className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">组合追踪器</div>
        <h1 className="mt-3 font-extrabold uppercase leading-[0.9] tracking-tight" style={{ fontSize: "clamp(2.4rem, 6vw, 4.4rem)" }}>
          Portfolio
          <br />
          <span className="text-accent">追踪看板</span>
        </h1>
        <div className="mt-6 flex items-center gap-2 font-mono text-xs text-muted">
          <span
            className="inline-block h-2 w-2"
            style={{ background: quoteState === "live" ? "#1baf7a" : quoteState === "off" ? "#e34948" : "var(--color-muted)" }}
          />
          {quoteState === "live" ? "行情实时（FMP + Binance）" : quoteState === "off" ? "行情未接入，PNL 暂不可用" : "行情加载中"}
        </div>
      </header>

      {/* ── 概览 ── */}
      <div className="mt-10 grid grid-cols-2 border-2 border-border md:grid-cols-4">
        {[
          { label: "持仓", value: String(positions.length) },
          { label: "多 / 空", value: `${longCount} / ${shortCount}` },
          { label: "总浮盈", value: totalPnl === null ? "—" : `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(1)}%`, accent: totalPnl },
          { label: "本周需关注", value: String(needAttention) },
        ].map((s, i) => (
          <div key={s.label} className={`p-5 ${i > 0 ? "border-t-2 border-border md:border-t-0 md:border-l-2" : ""} ${i >= 2 ? "border-t-2 md:border-t-0" : ""}`}>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted">{s.label}</div>
            <div
              className="mt-2 font-mono text-3xl font-bold tracking-tight"
              style={{ color: typeof s.accent === "number" ? (s.accent >= 0 ? "#0f6e56" : "#993556") : undefined }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── 净值曲线 + 分布 ── */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div ref={eqRef} className="min-w-0 border-2 border-border p-5 lg:col-span-2">
          <div className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">资产净值</div>
          {eqW > 0 && (
            <AreaChart width={eqW - 40} height={200} data={data?.equityCurve ?? []}>
              <defs>
                <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1baf7a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#1baf7a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={36} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: "monospace" }} />
              <Area type="monotone" dataKey="v" stroke="#1baf7a" strokeWidth={2} fill="url(#eqFill)" />
            </AreaChart>
          )}
        </div>
        <div ref={pieRef} className="min-w-0 border-2 border-border p-5">
          <div className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">持仓分布</div>
          {pieW > 0 && (
            <PieChart width={pieW - 40} height={160}>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: "monospace" }} />
            </PieChart>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 持仓卡片 ── */}
      <div className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">持仓 · 点击展开</div>
      <div className="mt-4 space-y-3">
        {positions.map((p) => {
          const price = priceOf(p.symbol);
          const pnl = pnlPct(p, price);
          const isOpen = expanded[p.id];
          const flags = watchBySymbol[p.symbol.toUpperCase()]?.map((w) => w.type) ?? [];
          const uniqFlags = Array.from(new Set(flags));
          return (
            <div key={p.id} className="border-2 border-border">
              <button
                onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
                className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-foreground/[0.02]"
                aria-expanded={isOpen}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">{p.symbol}</span>
                    <span
                      className={`border px-2 py-0.5 font-mono text-[11px] ${p.direction === "long" ? "border-emerald-500/40 text-emerald-600" : "border-pink-500/40 text-pink-600"}`}
                    >
                      {p.direction === "long" ? "做多" : "做空"}
                    </span>
                    <span className="font-mono text-xs text-muted">{p.size}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-muted">
                      {p.entryPrice ?? "—"} → {price !== null ? price.toLocaleString() : "…"}
                    </span>
                    <span className="min-w-[52px] text-right font-bold" style={{ color: pnl === null ? "var(--color-muted)" : pnl >= 0 ? "#0f6e56" : "#993556" }}>
                      {pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm text-foreground/70">
                    <span className="text-muted">想法：</span>
                    {p.logic}
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5">
                    {uniqFlags.map((f) => (
                      <span key={f} className={`border px-1.5 py-0.5 font-mono text-[10px] ${FLAG_META[f].cls}`}>
                        {FLAG_META[f].label}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t-2 border-border p-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 font-mono text-xs md:grid-cols-4">
                    <Field label="开仓时间" value={new Date(p.entryTime).toLocaleDateString("zh-CN")} />
                    <Field label="入场价" value={p.entryPrice ?? "—"} />
                    <Field label="止损位" value={p.stopLoss ?? "—"} valueClass="text-red-500" />
                    <Field label="信念度" value={"●".repeat(p.conviction) + "○".repeat(5 - p.conviction)} valueClass="text-amber-500 tracking-widest" />
                  </div>
                  <div className="mt-4 space-y-4 text-sm leading-relaxed">
                    <Block label="开仓逻辑" cls="border-violet-500/40 text-violet-500" text={p.logic} />
                    {p.plan && <Block label="开仓计划" cls="border-blue-500/40 text-blue-500" text={p.plan} />}
                    <Block label="✅ 验证信号（对了）" cls="border-emerald-500/40 text-emerald-600" text={p.validate} />
                    <Block label="❌ 证伪信号（错了）" cls="border-pink-500/40 text-pink-600" text={p.invalidate} />
                    {p.lastReview && (
                      <div className="border-t border-border pt-3 font-mono text-xs text-muted">↺ {p.lastReview}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 本周关注清单 ── */}
      <div className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">本周关注清单</div>
      <div className="mt-4 border-2 border-border">
        {(data?.watchlist ?? []).map((w, i) => {
          const m = WATCH_META[w.type];
          return (
            <div key={i} className={`flex gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <span className={`h-fit border px-2 py-0.5 font-mono text-[11px] ${m.cls}`}>{m.label}</span>
              <div className="text-sm leading-relaxed text-foreground/85">
                <span className="font-mono font-bold">{w.symbol}</span> · {w.text}
              </div>
            </div>
          );
        })}
        {(data?.watchlist ?? []).length === 0 && (
          <div className="p-4 text-sm text-muted">暂无关注清单，每周日晚 coach 会生成。</div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase text-muted">{label}</div>
      <div className={`mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}

function Block({ label, cls, text }: { label: string; cls: string; text: string }) {
  return (
    <div>
      <span className={`inline-block border px-2 py-0.5 font-mono text-[11px] ${cls}`}>{label}</span>
      <p className="mt-2 text-foreground/85">{text}</p>
    </div>
  );
}
