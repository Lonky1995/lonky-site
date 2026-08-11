"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  hook,
  snapshot,
  timeline,
  q2Beat,
  danaDeal,
  nvidiaDeal,
  bernstein,
  minorEvents,
  q3Watch,
  upcoming,
  pricingStatus,
  PRICED_LABELS,
  q3Checklist,
  longChecklist,
  logicChain,
  thisWeek,
  QUOTE_SYMBOLS,
  LAST_UPDATED,
} from "@/data/etn-dashboard";

type Quote = { symbol: string; price: number; changesPercentage: number; marketCap: number; pe: number | null };

const GREEN = "#4F6B52";
const RED = "#A3392F";

function fmtMktCap(v: number) {
  if (!v) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

function SectionHead({ index, title, sub }: { index: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 mt-24 flex items-baseline gap-4 border-t-2 border-border pt-4">
      <span className="font-mono text-sm text-accent">{index}</span>
      <h2 className="text-2xl font-extrabold uppercase tracking-tight md:text-3xl">{title}</h2>
      {sub && <span className="hidden text-sm text-muted md:inline">{sub}</span>}
    </div>
  );
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  done: { label: "已发生", cls: "bg-foreground text-background" },
  pending: { label: "验证中", cls: "bg-accent/20" },
  future: { label: "未到来", cls: "" },
};

export default function EtnDashboard() {
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

  const etn = quotes["ETN"];

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-8">
      {/* ── 页头 ── */}
      <header>
        <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Link href="/" className="hover:text-accent">
            ← lonky.me
          </Link>
          <span>Catalyst Tracker · {LAST_UPDATED}</span>
        </div>
        <div className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
          {snapshot.sector} ▸ AI 电力基建 ▸ {snapshot.ticker}
        </div>
        <h1
          className="mt-3 font-extrabold uppercase leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}
        >
          ETN 催化剂
          <br />
          <span className="text-accent">追踪看板</span>
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed">{hook}</p>

        {/* 快照条 */}
        <div className="mt-8 grid grid-cols-2 border-2 border-border md:grid-cols-4">
          {[
            { k: "现价", v: etn ? `$${etn.price?.toFixed(2)}` : snapshot.price, sub: etn ? fmtMktCap(etn.marketCap) : snapshot.marketCap },
            { k: "多头目标", v: snapshot.bull.target, sub: snapshot.bull.by, tone: GREEN },
            { k: "空头目标", v: snapshot.bear.target, sub: snapshot.bear.by, tone: RED },
            { k: "当前仓位", v: "无", sub: "待 Q3 验证" },
          ].map((c, i) => (
            <div
              key={c.k}
              className={[
                "border-border p-4",
                // 手机 2 列：右列加左边框，第二行加上边框
                i % 2 === 0 ? "border-l-0" : "border-l-2",
                i < 2 ? "border-t-0" : "border-t-2",
                // 桌面 4 列：单行，只在列间加左边框
                i % 4 === 0 ? "md:border-l-0" : "md:border-l-2",
                "md:border-t-0",
              ].join(" ")}
            >
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted">{c.k}</div>
              <div className="mt-1 font-mono text-2xl font-bold tracking-tight" style={c.tone ? { color: c.tone } : undefined}>
                {c.v}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 font-mono text-xs text-muted">
          <span
            className="inline-block h-2 w-2"
            style={{ background: quoteState === "live" ? GREEN : quoteState === "off" ? RED : "var(--color-muted)" }}
          />
          {quoteState === "live" ? "行情实时（FMP，60s 缓存）" : quoteState === "off" ? "行情未接入，显示笔记快照价" : "行情加载中"}
        </div>
      </header>

      {/* ── 01 时间线 ── */}
      <SectionHead index="01" title="催化路线图" sub="从 Boyd 收购到 2027 备考指引" />
      <div className="grid grid-cols-1 md:grid-cols-4">
        {timeline.map((t, i) => {
          const st = STATUS_STYLE[t.status];
          return (
            <div
              key={t.period}
              className={`border-2 border-border p-5 ${i > 0 ? "border-t-0 md:border-t-2 md:border-l-0" : ""} ${st.cls}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold">{t.period}</span>
                <span className={`font-mono text-[10px] uppercase ${t.status === "done" ? "opacity-70" : "text-muted"}`}>{st.label}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {t.events.map((e) => (
                  <li key={e} className={`text-[13px] leading-snug ${t.status === "done" ? "opacity-90" : "text-foreground/80"}`}>
                    · {e}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ── 02 Q2 超预期 ── */}
      <SectionHead index="02" title="催化剂 01 · Q2 业绩" sub={`${q2Beat.date} · 单日 ${q2Beat.reaction}`} />
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5">指标</th>
              <th className="px-4 py-2.5">Q2 实际</th>
              <th className="px-4 py-2.5">市场预期</th>
              <th className="px-4 py-2.5 text-right">幅度</th>
            </tr>
          </thead>
          <tbody>
            {q2Beat.metrics.map((m, i) => (
              <tr key={m.label} className={i > 0 ? "border-t border-border/30" : ""}>
                <td className="px-4 py-3 text-[13px] text-foreground/75">{m.label}</td>
                <td className="px-4 py-3 font-mono text-sm font-bold">{m.actual}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-muted">{m.consensus}</td>
                <td className="px-4 py-3 text-right font-mono text-[13px] font-bold" style={{ color: GREEN }}>
                  {m.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">全年指引上调</h3>
      <div className="border-2 border-border">
        {q2Beat.guidance.map((g, i) => (
          <div
            key={g.label}
            className={`grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-[180px_1fr_1fr_160px] md:items-baseline md:gap-4 ${i > 0 ? "border-t border-border/30" : ""}`}
          >
            <span className="text-[13px] font-semibold">{g.label}</span>
            <span className="font-mono text-[13px] text-muted">原：{g.from}</span>
            <span className="font-mono text-sm font-bold">新：{g.to}</span>
            <span className="font-mono text-[12px] font-bold md:text-right" style={{ color: GREEN }}>
              {g.delta}
            </span>
          </div>
        ))}
      </div>

      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">关键分项</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {q2Beat.segments.map((s) => (
          <div key={s.line} className="border-2 border-border p-5">
            <div className="font-bold">{s.line}</div>
            <div className="mt-1 font-mono text-2xl font-bold tracking-tight text-accent">{s.growth}</div>
            <p className="mt-2 text-[13px] leading-snug text-foreground/75">{s.note}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 border-l-4 border-accent pl-6 font-serif text-lg leading-relaxed">{q2Beat.takeaway}</p>

      {/* ── 03 Mobility + Dana ── */}
      <SectionHead index="03" title="催化剂 02 · Mobility + Dana" sub={`宣布 ${danaDeal.announced} · 预计 ${danaDeal.closing} 完成`} />
      <div className="grid grid-cols-1 border-2 border-border sm:grid-cols-2 md:grid-cols-4">
        {danaDeal.terms.map((t, i) => (
          <div
            key={t.label}
            className={[
              "border-border p-4",
              // 手机：单列，除首项外每项一条上边框
              i > 0 ? "border-t-2" : "",
              // 平板 2 列：左列去掉左边框，第一行去掉上边框
              i % 2 === 0 ? "sm:border-l-0" : "sm:border-l-2",
              i < 2 ? "sm:border-t-0" : "sm:border-t-2",
              // 桌面 4 列：同理按 4 取模
              i % 4 === 0 ? "md:border-l-0" : "md:border-l-2",
              i < 4 ? "md:border-t-0" : "md:border-t-2",
            ].join(" ")}
          >
            <div className="font-mono text-[11px] uppercase leading-snug text-muted">{t.label}</div>
            <div className="mt-1.5 font-mono text-base font-bold leading-tight">{t.value}</div>
          </div>
        ))}
      </div>

      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">战略意义的三个层次</h3>
      <div className="space-y-4">
        {danaDeal.layers.map((l, i) => (
          <div key={l.title} className="grid grid-cols-1 gap-2 border-2 border-border p-5 md:grid-cols-[240px_1fr] md:gap-6">
            <div className="text-base font-bold leading-snug text-accent">
              <span className="font-mono text-xs text-muted">0{i + 1} · </span>
              {l.title}
            </div>
            <div className="text-[14px] leading-relaxed text-foreground/80">{l.text}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 border-2 border-border bg-card p-5">
        <div className="font-mono text-xs uppercase tracking-widest text-accent">为什么被低估</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">{danaDeal.underrated}</p>
      </div>

      {/* ── 04 NVIDIA ── */}
      <SectionHead index="04" title="催化剂 03 · NVIDIA 生态绑定" sub={nvidiaDeal.date} />
      <div className="border-2 border-border">
        {nvidiaDeal.points.map((p, i) => (
          <div key={p} className={`flex gap-3 px-4 py-3 text-[14px] leading-relaxed text-foreground/85 ${i > 0 ? "border-t border-border/30" : ""}`}>
            <span className="shrink-0 font-mono text-sm font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
            {p}
          </div>
        ))}
      </div>
      <p className="mt-6 border-l-4 border-accent pl-6 font-serif text-lg leading-relaxed">{nvidiaDeal.takeaway}</p>

      {/* ── 05 Bernstein + 补充事件 ── */}
      <SectionHead index="05" title="催化剂 04 · 卖方与补充事件" sub="Bernstein Best Idea + 四个次级事件" />
      <div className="border-2 border-border p-6">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="text-lg font-bold">Bernstein SDC「Best Idea」</span>
          <span className="font-mono text-xs text-muted">{bernstein.date}</span>
          <span className="bg-foreground px-2 py-0.5 font-mono text-[11px] uppercase text-background">{bernstein.rating}</span>
          <span className="ml-auto font-mono text-2xl font-bold" style={{ color: GREEN }}>
            {bernstein.target}
          </span>
        </div>
        <ul className="mt-4 space-y-2 border-t border-border/30 pt-4">
          {bernstein.points.map((p) => (
            <li key={p} className="text-[14px] leading-relaxed text-foreground/80">
              · {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5">事件</th>
              <th className="px-4 py-2.5">日期</th>
              <th className="px-4 py-2.5">意义</th>
            </tr>
          </thead>
          <tbody>
            {minorEvents.map((e, i) => (
              <tr key={e.event} className={i > 0 ? "border-t border-border/30" : ""}>
                <td className="px-4 py-3 text-[13px] font-bold">{e.event}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{e.date}</td>
                <td className="px-4 py-3 text-[13px] leading-snug text-foreground/75">{e.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 06 Q3 分水岭 ── */}
      <SectionHead index="06" title="Q3 · 分水岭" sub={`${q3Watch.when} · 多空叙事的终极验证`} />
      <div className="border-2 p-6" style={{ borderColor: RED }}>
        <div className="font-mono text-xs uppercase tracking-widest" style={{ color: RED }}>
          最高优先级
        </div>
        <p className="mt-2 font-serif text-xl leading-relaxed">{q3Watch.why}</p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border-2" style={{ borderColor: GREEN }}>
          <div className="border-b-2 px-4 py-2.5 font-bold text-background" style={{ background: GREEN, borderColor: GREEN }}>
            Bull case 验证信号
          </div>
          <ul className="divide-y divide-border/30">
            {q3Watch.bull.map((b) => (
              <li key={b} className="px-4 py-3 text-[14px] leading-snug">
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-2" style={{ borderColor: RED }}>
          <div className="border-b-2 px-4 py-2.5 font-bold text-background" style={{ background: RED, borderColor: RED }}>
            Bear case 验证信号
          </div>
          <ul className="divide-y divide-border/30">
            {q3Watch.bear.map((b) => (
              <li key={b} className="px-4 py-3 text-[14px] leading-snug">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 border-2 border-border bg-foreground p-5 font-serif text-lg leading-relaxed text-background">
        {q3Watch.pricing}
      </p>

      <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">其余待兑现催化剂</h3>
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5">催化剂</th>
              <th className="px-4 py-2.5">预期时间</th>
              <th className="w-[38%] px-4 py-2.5">潜在影响</th>
              <th className="px-4 py-2.5">当前预期</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((u, i) => (
              <tr key={u.name} className={`${i > 0 ? "border-t border-border/30" : ""} ${u.priority === "mid" ? "" : "bg-card/50"}`}>
                <td className="px-4 py-3 align-top text-[13px] font-bold">
                  <span className="mr-1.5" style={{ color: u.priority === "mid" ? "var(--color-accent)" : "var(--color-muted)" }}>
                    ●
                  </span>
                  {u.name}
                </td>
                <td className="px-4 py-3 align-top font-mono text-[12px] text-muted">{u.when}</td>
                <td className="px-4 py-3 align-top text-[13px] leading-snug text-foreground/75">{u.impact}</td>
                <td className="px-4 py-3 align-top text-[13px] leading-snug">{u.expectation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 07 定价状态 ── */}
      <SectionHead index="07" title="定价状态评估" sub="哪些已被股价消化 · 哪些还是纯期权" />
      <div className="border-2 border-border">
        {pricingStatus.map((p, i) => (
          <div key={p.catalyst} className={`px-4 py-4 ${i > 0 ? "border-t border-border/30" : ""} ${p.priced === 0 ? "bg-accent/10" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold">{p.catalyst}</span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px]">
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((k) => (
                    <span
                      key={k}
                      className="inline-block h-2.5 w-6"
                      style={{
                        background: k <= p.priced ? (p.priced === 2 ? "var(--color-muted)" : "var(--color-accent)") : "var(--color-card)",
                        border: "1px solid var(--color-border)",
                      }}
                    />
                  ))}
                </span>
                <span className={p.priced === 0 ? "font-bold text-accent" : "text-muted"}>{PRICED_LABELS[p.priced]}</span>
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-foreground/70">{p.basis}</p>
          </div>
        ))}
      </div>

      {/* ── 08 逻辑链 ── */}
      <SectionHead index="08" title="催化剂逻辑链" sub="已验证信心 → 待验证估值" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[logicChain.done, logicChain.next].map((col, ci) => (
          <div key={col.title} className="border-2 border-border">
            <div className={`border-b-2 border-border px-4 py-2.5 font-mono text-xs uppercase tracking-widest ${ci === 0 ? "bg-card" : "bg-foreground text-background"}`}>
              {col.title}
            </div>
            <div className="divide-y divide-border/30">
              {col.items.map((it) => (
                <div key={it.head} className="px-4 py-4">
                  <div className="text-sm font-bold leading-snug">{it.head}</div>
                  <ul className="mt-2 space-y-1">
                    {it.subs.map((s) => (
                      <li key={s} className="font-mono text-[12px] leading-snug text-foreground/70">
                        └ {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── 09 监控清单 ── */}
      <SectionHead index="09" title="监控清单" sub="Q3 逐项打勾 · 中长期跟踪" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border-2 border-border">
          <div className="border-b-2 border-border bg-card px-4 py-2.5 font-mono text-xs uppercase tracking-widest">Q3 业绩监控</div>
          <ul className="divide-y divide-border/30">
            {q3Checklist.map((c) => (
              <li key={c} className="flex gap-3 px-4 py-3 text-[13px] leading-snug">
                <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 border-2 border-border" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-2 border-border">
          <div className="border-b-2 border-border bg-card px-4 py-2.5 font-mono text-xs uppercase tracking-widest">中长期监控</div>
          <ul className="divide-y divide-border/30">
            {longChecklist.map((c) => (
              <li key={c} className="flex gap-3 px-4 py-3 text-[13px] leading-snug">
                <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 border-2 border-border" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── 10 本周关注 ── */}
      <SectionHead index="10" title="本周关注" sub={`截至 ${LAST_UPDATED}`} />
      <div className="border-2 border-border">
        {thisWeek.map((t, i) => (
          <div key={t.when} className={`grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-[100px_1fr] md:gap-4 ${i > 0 ? "border-t border-border/30" : ""}`}>
            <span className="font-mono text-sm font-bold text-accent">{t.when}</span>
            <span className="text-[13px] leading-snug text-foreground/80">{t.what}</span>
          </div>
        ))}
      </div>

      {/* ── 页脚 ── */}
      <footer className="mt-24 border-t-2 border-border pt-4 font-mono text-[11px] leading-relaxed text-muted">
        <p>
          数据来源：Eaton Q2 2026 财报与全年指引 · Mobility + Dana 合并公告 · NVIDIA GTC 2026 · Bernstein SDC 研报（目标价 $534）·
          UBS（目标价 $360）· 行情：Financial Modeling Prep（延迟约 60s）
        </p>
        <p className="mt-2">个人研究笔记，不构成投资建议。定价状态评估为主观判断。最后更新：{LAST_UPDATED}</p>
      </footer>
    </main>
  );
}
