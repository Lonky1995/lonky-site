"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ThesisCategory, ThesisProjection, ThesisSnapshot, ThesisStatus } from "@/lib/thesis-store";

const statusLabel: Record<ThesisStatus, string> = { exploring: "研究中", monitoring: "跟踪中", supported: "获得支持", weakened: "出现反例", invalidated: "已失效", archived: "已归档" };
const categoryLabel: Record<ThesisCategory, string> = { crypto: "加密", "us-equities": "美股", "market-structure": "交易结构", other: "其他" };
const statusTone: Record<ThesisStatus, string> = { exploring: "text-amber-200", monitoring: "text-sky-200", supported: "text-emerald-300", weakened: "text-orange-300", invalidated: "text-rose-300", archived: "text-zinc-400" };

function shortDate(value: string) { return value ? new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(value)) : "—"; }
function evidenceCount(thesis: ThesisProjection, stance: "supports" | "weakens") { return thesis.evidence.filter((item) => item.stance === stance).length; }

function ThesisCard({ thesis, selected, onSelect }: { thesis: ThesisProjection; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`group min-h-56 rounded-2xl border p-5 text-left transition duration-200 ${selected ? "border-white/45 bg-white/[0.12]" : "border-white/10 bg-white/[0.035] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07]"}`}>
    <div className="flex items-start justify-between gap-3"><span className={`text-xs font-medium ${statusTone[thesis.status]}`}>{statusLabel[thesis.status]}</span><span className="text-xs text-muted">r{thesis.revision}</span></div>
    <h3 className="mt-7 text-xl font-semibold tracking-tight text-white">{thesis.title}</h3>
    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{thesis.claim.text}</p>
    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted"><span>{thesis.symbols.join(" · ") || categoryLabel[thesis.category]}</span><span>{shortDate(thesis.updatedAt)}</span></div>
  </button>;
}

function ThesisDetail({ thesis }: { thesis: ThesisProjection }) {
  return <aside className="sticky top-24 rounded-2xl border border-white/12 bg-white/[0.055] p-6">
    <div className="flex justify-between gap-4"><div><p className={`text-sm ${statusTone[thesis.status]}`}>{statusLabel[thesis.status]}</p><h2 className="mt-2 font-serif text-2xl leading-tight text-white">{thesis.title}</h2></div><span className="text-xs text-muted">r{thesis.revision}</span></div>
    <p className="mt-6 text-base leading-7 text-white/85">{thesis.claim.text}</p>
    <DetailList title="因果链" items={thesis.causalChain} />
    <DetailList title="下一步看什么" items={thesis.keyQuestions} />
    <section className="mt-7 border-t border-white/10 pt-5"><p className="text-xs uppercase tracking-[0.16em] text-muted">证据状态</p><div className="mt-3 flex gap-3 text-sm"><span className="text-emerald-300">支持 {evidenceCount(thesis, "supports")}</span><span className="text-orange-300">削弱 {evidenceCount(thesis, "weakens")}</span><span className="text-muted">记录 {thesis.evidence.length}</span></div>{thesis.evidence.length > 0 && <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">{thesis.evidence.slice(-3).reverse().map((item) => <li key={item.id}><span className={item.stance === "supports" ? "text-emerald-300" : item.stance === "weakens" ? "text-orange-300" : "text-sky-200"}>{item.stance === "supports" ? "支持" : item.stance === "weakens" ? "削弱" : "上下文"}</span> · {item.statement}</li>)}</ul>}</section>
  </aside>;
}
function DetailList({ title, items }: { title: string; items: string[] }) { return <section className="mt-7 border-t border-white/10 pt-5"><p className="text-xs uppercase tracking-[0.16em] text-muted">{title}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-white/80">{items.length ? items.map((item) => <li key={item} className="border-l border-white/20 pl-3">{item}</li>) : <li className="text-muted">尚未记录</li>}</ul></section>; }

export default function ThesisDashboard() {
  const [data, setData] = useState<ThesisSnapshot | null>(null); const [error, setError] = useState<string | null>(null); const [active, setActive] = useState<ThesisCategory | "all">("all"); const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { fetch("/api/private/theses", { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "thesis_read_failed"); setData(body); setSelectedId(body.theses[0]?.id ?? null); }).catch((cause) => setError(cause instanceof Error ? cause.message : "thesis_read_failed")); }, []);
  const visible = useMemo(() => (data?.theses ?? []).filter((item) => active === "all" || item.category === active), [data, active]); const selected = visible.find((item) => item.id === selectedId) ?? visible[0];
  if (error === "sign_in_required") return <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-8"><p className="text-lg text-white">Thesis 是私有研究记录。</p><Link className="mt-4 inline-block text-sm text-accent underline underline-offset-4" href="/sign-in?redirect_url=/market?tab=thesis">登录后查看</Link></div>;
  if (error) return <div className="mt-10 rounded-2xl border border-rose-300/25 bg-rose-300/5 p-6 text-sm text-rose-100">Thesis 暂不可用：{error}</div>;
  if (!data) return <div className="mt-10 text-sm text-muted">正在读取研究记录…</div>;
  return <div className="mt-9"><div className="flex flex-wrap gap-2 border-y border-white/10 py-4">{(["all", "crypto", "us-equities", "market-structure"] as const).map((key) => <button key={key} onClick={() => setActive(key)} className={`rounded-full px-3 py-1.5 text-sm transition ${active === key ? "bg-white text-black" : "text-muted hover:bg-white/10 hover:text-white"}`}>{key === "all" ? `全部 ${data.theses.length}` : categoryLabel[key]}</button>)}</div>{visible.length === 0 ? <p className="py-16 text-sm text-muted">这个分类还没有 Thesis。</p> : <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="grid gap-4 sm:grid-cols-2">{visible.map((thesis) => <ThesisCard key={thesis.id} thesis={thesis} selected={thesis.id === selected?.id} onSelect={() => setSelectedId(thesis.id)} />)}</div>{selected && <ThesisDetail thesis={selected} />}</div>}</div>;
}
