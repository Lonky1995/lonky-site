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
  return <section className="border-t border-white/10 py-5">{title && <p className="text-xs uppercase tracking-[0.16em] text-muted">{title}</p>}<ul className={`${title ? "mt-3" : ""} space-y-2 text-sm leading-6 text-white/80`}>{items.length ? items.map((item) => <li key={item} className="border-l border-white/20 pl-3">{item}</li>) : <li className="text-muted">尚未记录</li>}</ul></section>;
}

function EvidenceEntry({ item, compact = false }: { item: ThesisProjection["evidence"][number]; compact?: boolean }) {
  const label = item.stance === "supports" ? "支持" : item.stance === "weakens" ? "反证" : "上下文";
  const tone = item.stance === "supports" ? "text-emerald-300" : item.stance === "weakens" ? "text-orange-300" : "text-sky-200";
  return <li className={compact ? "border-l border-white/15 pl-3" : "border-b border-white/10 pb-4 last:border-0 last:pb-0"}>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span className={tone}>{label}</span><span className="text-white/35">{shortDate(item.source.observedAt)} · {item.source.name}</span></div>
    <p className={compact ? "mt-1 text-sm leading-6 text-white/75" : "mt-2 text-sm leading-6 text-white/85"}>{item.statement}</p>
  </li>;
}

function SectionHeading({ eyebrow, title, summary }: { eyebrow: string; title: string; summary?: string }) {
  return <div className="mb-4"><p className="text-[11px] uppercase tracking-[0.18em] text-muted">{eyebrow}</p><h3 className="mt-1 text-base font-medium text-white">{title}</h3>{summary && <p className="mt-1 text-sm leading-6 text-muted">{summary}</p>}</div>;
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

  const history = thesis.evidence.slice().sort((a, b) => b.source.observedAt.localeCompare(a.source.observedAt));
  const context = history.filter((item) => item.stance === "context");
  const supports = history.filter((item) => item.stance === "supports");
  const weakens = history.filter((item) => item.stance === "weakens");
  const nextSignals = thesis.validationSignals.filter((item) => item.status === "pending");
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="thesis-title" className="mx-auto flex min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#121511] shadow-2xl sm:my-6 sm:max-h-[calc(100dvh-3rem)]">
      <header className="shrink-0 border-b border-white/10 bg-[#151914] px-6 py-5 sm:px-9">
        <div className="flex items-start justify-between gap-6"><div><p className="text-[11px] uppercase tracking-[0.18em] text-muted">Thesis · 持续研究</p><h2 id="thesis-title" className="mt-2 max-w-3xl font-serif text-2xl leading-tight text-white sm:text-3xl">{thesis.title}</h2><p className="mt-3 text-sm leading-6 text-white/75">{thesis.claim.text}</p></div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-sm text-muted transition hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">关闭</button>
        </div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs"><span className={`text-sm ${statusTone[thesis.status]}`}>{statusLabel[thesis.status]}</span><span className="text-muted">{categoryLabel[thesis.category]} · r{thesis.revision}</span><span className="text-muted">创建 {shortDate(thesis.createdAt)} · 更新 {shortDate(thesis.updatedAt)}</span></div>
        {thesis.lifecycle === "closed" && <p className="mt-3 text-sm text-zinc-400">关闭说明 · {thesis.closeReason || "用户结束跟踪"}</p>}
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-7 sm:px-9 sm:py-9">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <main className="min-w-0 space-y-9">
            <section><SectionHeading eyebrow="Research history" title="历史研究与上下文" summary="按来源时间记录，讨论本身不等于验证结论。" />{history.length ? <ol className="space-y-4">{history.map((item) => <EvidenceEntry key={item.id} item={item} />)}</ol> : <p className="text-sm text-muted">尚未沉淀研究记录。</p>}</section>
            <section className="border-t border-white/10 pt-7"><SectionHeading eyebrow="Mechanism" title="因果链" summary="这个 Thesis 依赖哪些环节成立。" /><DetailList title="" items={thesis.causalChain} /></section>
            <section className="border-t border-white/10 pt-7"><SectionHeading eyebrow="Evidence" title="证据支持与反证" summary={`支持 ${supports.length} 条 · 反证 ${weakens.length} 条 · 上下文 ${context.length} 条`} /><div className="grid gap-6 sm:grid-cols-2"><div><p className="mb-3 text-sm text-emerald-300">支持</p><ul className="space-y-4">{supports.length ? supports.map((item) => <EvidenceEntry key={item.id} item={item} compact />) : <li className="text-sm text-muted">尚无支持证据。</li>}</ul></div><div><p className="mb-3 text-sm text-orange-300">反证 / 削弱</p><ul className="space-y-4">{weakens.length ? weakens.map((item) => <EvidenceEntry key={item.id} item={item} compact />) : <li className="text-sm text-muted">尚未记录反证；这不等于 Thesis 已被证实。</li>}</ul></div></div></section>
            <section className="border-t border-white/10 pt-7"><SectionHeading eyebrow="Next checks" title="下一步看什么" summary="待观察的验证条件和未解问题。" /><div className="grid gap-6 sm:grid-cols-2"><div><p className="mb-3 text-sm text-white/85">验证信号</p><ul className="space-y-2 text-sm leading-6 text-white/80">{nextSignals.length ? nextSignals.map((signal) => <li key={signal.id} className="border-l border-white/20 pl-3"><span className={signal.direction === "support" ? "text-emerald-300" : "text-orange-300"}>{signal.direction === "support" ? "确认" : "削弱"}</span><span className="ml-2">{signal.condition}</span></li>) : <li className="text-muted">尚未定义待验证信号。</li>}</ul></div><div><p className="mb-3 text-sm text-white/85">待回答问题</p><ul className="space-y-2 text-sm leading-6 text-white/80">{thesis.keyQuestions.length ? thesis.keyQuestions.map((item) => <li key={item} className="border-l border-white/20 pl-3">{item}</li>) : <li className="text-muted">暂无待回答问题。</li>}</ul></div></div></section>
            {thesis.alternatives.length > 0 && <section className="border-t border-white/10 pt-7"><SectionHeading eyebrow="Competing explanations" title="竞争解释" /><DetailList title="" items={thesis.alternatives.map((item) => item.whatWouldDifferentiate ? `${item.text}；区分条件：${item.whatWouldDifferentiate}` : item.text)} /></section>}
          </main>
          <aside className="h-fit border-t border-white/10 pt-7 lg:sticky lg:top-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><InstrumentDetails instruments={thesis.instruments || []} /><section className="border-t border-white/10 py-5"><p className="text-xs uppercase tracking-[0.16em] text-muted">研究健康度</p><div className="mt-3 space-y-1 text-sm"><p className="text-emerald-300">支持 {evidenceCount(thesis, "supports")}</p><p className="text-orange-300">反证 {evidenceCount(thesis, "weakens")}</p><p className="text-sky-200">上下文 {context.length}</p><p className="text-muted">待验证 {nextSignals.length}</p></div></section></aside>
        </div>
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
