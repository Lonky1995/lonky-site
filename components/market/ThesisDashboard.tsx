"use client";

import { useEffect, useMemo, useState } from "react";
import type { ThesisCategory, ThesisInstrument, ThesisProjection, ThesisSnapshot, ThesisStatus } from "@/lib/thesis-store";

const statusLabel: Record<ThesisStatus, string> = { exploring: "研究中", monitoring: "跟踪中", supported: "获得支持", weakened: "出现反例", invalidated: "已失效", archived: "已归档" };
const categoryLabel: Record<ThesisCategory, string> = { crypto: "加密", "us-equities": "美股", "market-structure": "交易结构", other: "其他" };
const statusTone: Record<ThesisStatus, string> = { exploring: "text-amber-200", monitoring: "text-sky-200", supported: "text-emerald-300", weakened: "text-orange-300", invalidated: "text-rose-300", archived: "text-zinc-400" };

function shortDate(value: string) {
  return value ? new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(value)) : "—";
}

function evidenceCount(thesis: ThesisProjection, stance: "supports" | "weakens") {
  return thesis.evidence.filter((item) => item.stance === stance).length;
}

function formatPrice(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = value >= 1_000 ? 0 : value >= 1 ? 2 : 4;
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)}`;
}

function priceChange(instrument: ThesisInstrument) {
  if (instrument.initialPrice == null || instrument.currentPrice == null || instrument.initialPrice === 0) return null;
  const absolute = instrument.currentPrice - instrument.initialPrice;
  return { absolute, percent: absolute / instrument.initialPrice * 100 };
}

function PriceLine({ instrument }: { instrument: ThesisInstrument }) {
  const change = priceChange(instrument);
  const tone = change == null ? "text-muted" : change.percent >= 0 ? "text-emerald-300" : "text-rose-300";
  return <div className="mt-4 border-t border-white/10 pt-3"><div className="flex items-baseline justify-between gap-3"><span className="text-xs font-medium text-white/85">{instrument.symbol}</span><span className="text-xs text-muted">创建 {formatPrice(instrument.initialPrice)} → 当前 {formatPrice(instrument.currentPrice)}</span></div><p className={`mt-1 text-sm ${tone}`}>{change ? `${change.percent >= 0 ? "+" : ""}${change.percent.toFixed(2)}%` : "待补基准价格"}</p></div>;
}

function ThesisCard({ thesis, onOpen }: { thesis: ThesisProjection; onOpen: () => void }) {
  const primary = (thesis.instruments || [])[0];
  const isClosed = thesis.lifecycle === "closed";
  return <button type="button" onClick={onOpen} aria-haspopup="dialog" className="group flex h-[280px] w-full flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
    <div className="flex items-start justify-between gap-3"><span className={`text-xs font-medium ${isClosed ? "text-zinc-400" : "text-emerald-300"}`}>{isClosed ? "已关闭" : "开放"}</span><span className="text-xs text-muted">{categoryLabel[thesis.category]}</span></div>
    <h3 className="mt-5 line-clamp-2 text-lg font-semibold leading-6 tracking-tight text-white">{thesis.title}</h3>
    <p className={`mt-2 text-xs ${statusTone[thesis.status]}`}>研究状态 · {statusLabel[thesis.status]}</p>
    {primary ? <PriceLine instrument={primary} /> : <div className="mt-4 border-t border-white/10 pt-3 text-sm text-muted">未绑定可报价标的</div>}
    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted"><span>{thesis.symbols.join(" · ") || "未标注标的"}</span><span>创建 {shortDate(thesis.createdAt)}</span></div>
  </button>;
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return <section className="border-t border-white/10 py-5"><p className="text-xs uppercase tracking-[0.16em] text-muted">{title}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-white/80">{items.length ? items.map((item) => <li key={item} className="border-l border-white/20 pl-3">{item}</li>) : <li className="text-muted">尚未记录</li>}</ul></section>;
}

function InstrumentDetails({ instruments }: { instruments: ThesisInstrument[] }) {
  if (!instruments.length) return <section className="border-t border-white/10 py-5"><p className="text-xs uppercase tracking-[0.16em] text-muted">标的与价格</p><p className="mt-3 text-sm text-muted">此 Thesis 没有绑定可报价标的。</p></section>;
  return <section className="border-t border-white/10 py-5"><p className="text-xs uppercase tracking-[0.16em] text-muted">标的与价格</p><div className="mt-4 space-y-4">{instruments.map((instrument) => { const change = priceChange(instrument); const tone = change == null ? "text-muted" : change.percent >= 0 ? "text-emerald-300" : "text-rose-300"; return <div key={instrument.symbol} className="grid gap-1 border-l border-white/15 pl-3 text-sm sm:grid-cols-[72px_1fr_auto]"><span className="font-medium text-white">{instrument.symbol}</span><span className="text-muted">{formatPrice(instrument.initialPrice)} → {formatPrice(instrument.currentPrice)}</span><span className={tone}>{change ? `${change.percent >= 0 ? "+" : ""}${change.percent.toFixed(2)}%` : "基准待补"}</span><span className="sm:col-start-2 sm:col-span-2 text-xs text-white/35">{instrument.initialPriceBasis === "creation_quote" ? "创建时报价" : instrument.initialPriceBasis === "created_day_close" ? "创建日附近收盘价" : "未取得创建基准"}{instrument.currentPriceAt ? ` · 更新 ${shortDate(instrument.currentPriceAt)}` : ""}{instrument.source ? ` · ${instrument.source}` : ""}</span></div>; })}</div></section>;
}

function ThesisModal({ thesis, onClose }: { thesis: ThesisProjection; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="thesis-core-conclusion" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/15 bg-[#121511] shadow-2xl sm:rounded-3xl">
      <div className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-5 sm:px-9">
        <div><p className="text-xs uppercase tracking-[0.16em] text-muted">核心结论</p><h2 id="thesis-core-conclusion" className="mt-3 max-w-3xl font-serif text-2xl leading-tight text-white sm:text-3xl">{thesis.claim.text}</h2></div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-sm text-muted transition hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">关闭</button>
      </div>
      <div className="grid gap-9 px-6 py-7 sm:px-9 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <p className={`text-sm ${thesis.lifecycle === "closed" ? "text-zinc-400" : "text-emerald-300"}`}>{thesis.lifecycle === "closed" ? "已关闭" : "开放"} <span className={`ml-2 ${statusTone[thesis.status]}`}>研究状态 · {statusLabel[thesis.status]}</span> <span className="ml-2 text-muted">r{thesis.revision}</span></p>
          <p className="mt-3 text-sm text-muted">研究主题 · {thesis.title} · 创建于 {shortDate(thesis.createdAt)}</p>
          {thesis.lifecycle === "closed" && <p className="mt-3 text-sm text-zinc-400">关闭说明 · {thesis.closeReason || "用户结束跟踪"}</p>}
          <div className="mt-7"><InstrumentDetails instruments={thesis.instruments || []} /><DetailList title="因果链" items={thesis.causalChain} /><DetailList title="下一步看什么" items={thesis.keyQuestions} /></div>
        </div>
        <aside className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"><p className="text-xs uppercase tracking-[0.16em] text-muted">证据状态</p><div className="mt-3 space-y-1 text-sm"><p className="text-emerald-300">支持 {evidenceCount(thesis, "supports")}</p><p className="text-orange-300">削弱 {evidenceCount(thesis, "weakens")}</p><p className="text-muted">记录 {thesis.evidence.length}</p></div>{thesis.evidence.length > 0 && <ul className="mt-6 space-y-4 text-sm leading-6 text-muted">{thesis.evidence.slice().reverse().map((item) => <li key={item.id}><span className={item.stance === "supports" ? "text-emerald-300" : item.stance === "weakens" ? "text-orange-300" : "text-sky-200"}>{item.stance === "supports" ? "支持" : item.stance === "weakens" ? "削弱" : "上下文"}</span><p className="mt-1">{item.statement}</p><p className="mt-1 text-xs text-white/35">{item.source.name} · {shortDate(item.source.observedAt)}</p></li>)}</ul>}</aside>
      </div>
    </section>
  </div>;
}

export default function ThesisDashboard() {
  const [data, setData] = useState<ThesisSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ThesisCategory | "all">("all");
  const [selected, setSelected] = useState<ThesisProjection | null>(null);
  useEffect(() => { fetch("/api/private/theses").then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "thesis_read_failed"); setData(body); }).catch((cause) => setError(cause instanceof Error ? cause.message : "thesis_read_failed")); }, []);
  const visible = useMemo(() => (data?.theses ?? []).filter((item) => active === "all" || item.category === active), [data, active]);
  if (error) return <div className="mt-10 rounded-2xl border border-rose-300/25 bg-rose-300/5 p-6 text-sm text-rose-100">Thesis 暂不可用：{error}</div>;
  if (!data) return <div className="mt-10 text-sm text-muted">正在读取研究记录…</div>;
  return <div className="mt-9"><div className="flex flex-wrap gap-2 border-y border-white/10 py-4">{(["all", "crypto", "us-equities", "market-structure"] as const).map((key) => <button key={key} onClick={() => setActive(key)} className={`rounded-full px-3 py-1.5 text-sm transition ${active === key ? "bg-white text-black" : "text-muted hover:bg-white/10 hover:text-white"}`}>{key === "all" ? `全部 ${data.theses.length}` : categoryLabel[key]}</button>)}</div>{visible.length === 0 ? <p className="py-16 text-sm text-muted">这个分类还没有 Thesis。</p> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((thesis) => <ThesisCard key={thesis.id} thesis={thesis} onOpen={() => setSelected(thesis)} />)}</div>}{selected && <ThesisModal thesis={selected} onClose={() => setSelected(null)} />}</div>;
}
