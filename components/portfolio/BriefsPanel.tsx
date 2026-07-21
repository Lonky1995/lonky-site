"use client";

import { useEffect, useMemo, useState } from "react";

// 仓位动态简报面板：读 /api/portfolio/briefs（Grok 每日简报），按标的卡片展示。

type Section = { title: string; body: string };
type TickerBlock = { symbol: string; impact: string; sections: Section[] };
type BriefData = {
  date: string;
  tickers: TickerBlock[];
  portfolioInsight: string;
  availableDates?: string[];
  error?: string;
};

// 影响等级 → 徽章样式 + 排序权重（高在前）
const IMPACT_META: Record<string, { cls: string; dot: string; rank: number }> = {
  高: { cls: "border-red-500/50 bg-red-500/10 text-red-400", dot: "bg-red-500", rank: 0 },
  中: { cls: "border-amber-500/50 bg-amber-500/10 text-amber-400", dot: "bg-amber-500", rank: 1 },
  低: { cls: "border-muted/40 bg-foreground/[0.03] text-muted", dot: "bg-muted", rank: 2 },
};

function impactOf(impact: string) {
  return IMPACT_META[impact] ?? IMPACT_META["低"];
}

// 只展示有价值的字段（KB 字段常为空，过滤掉纯占位）
const SHOW_FIELDS = ["🌐外部背景", "对 thesis 的影响", "价格/定位含义", "下一步观察点"];

function isEmptyField(body: string): boolean {
  return /^（.*不可达.*）$|^（.*无.*）$|^—$/.test(body.trim());
}

// 取标的的一句话摘要：优先「外部背景」，退回首个非空字段
function summaryOf(t: TickerBlock): string {
  const bg = t.sections.find((s) => s.title.includes("外部背景") && !isEmptyField(s.body));
  const fallback = t.sections.find((s) => !isEmptyField(s.body));
  return (bg ?? fallback)?.body.trim() ?? "";
}

export default function BriefsPanel() {
  const [data, setData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/portfolio/briefs")
      .then((r) => r.json())
      .then((d: BriefData) => setData(d))
      .catch(() => setData({ date: "", tickers: [], portfolioInsight: "", error: "加载失败" }))
      .finally(() => setLoading(false));
  }, []);

  // 按影响等级排序（高→中→低），并在首次加载时把「高影响」标的默认展开
  const tickers = useMemo(() => {
    const list = [...(data?.tickers ?? [])];
    list.sort((a, b) => impactOf(a.impact).rank - impactOf(b.impact).rank);
    return list;
  }, [data]);

  useEffect(() => {
    if (!data?.tickers?.length) return;
    const initial: Record<string, boolean> = {};
    for (const t of data.tickers) if (t.impact === "高") initial[t.symbol] = true;
    setExpanded(initial);
  }, [data]);

  const allOpen = tickers.length > 0 && tickers.every((t) => expanded[t.symbol]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    for (const t of tickers) next[t.symbol] = !allOpen;
    setExpanded(next);
  };

  if (loading) {
    return <div className="py-12 text-center font-mono text-sm text-muted">加载简报中…</div>;
  }

  if (data?.error && (!data.tickers || data.tickers.length === 0)) {
    return (
      <div className="border-2 border-border p-6 font-mono text-sm text-muted">
        暂无简报数据：{data.error}
        <div className="mt-2 text-xs">简报由 Grok 每日生成后 push 到 vault，网站从 GitHub 读取。</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 标题栏：日期 + 一键展开 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-accent">每日动态简报</span>
          <span className="font-mono text-xs text-muted">{data?.date || "—"}</span>
        </div>
        {tickers.length > 0 && (
          <button
            onClick={toggleAll}
            className="font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:text-foreground"
          >
            {allOpen ? "全部收起 ↑" : "全部展开 ↓"}
          </button>
        )}
      </div>

      {/* ── 组合层面洞察（置顶强化）── */}
      {data?.portfolioInsight && (
        <div className="relative overflow-hidden rounded-lg border-2 border-accent/40 bg-gradient-to-br from-accent/[0.08] to-transparent p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-sm">◆</span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">组合层面洞察</span>
          </div>
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
            {data.portfolioInsight}
          </div>
        </div>
      )}

      {/* ── 按标的卡片 ── */}
      <div className="space-y-2.5">
        {tickers.map((t) => {
          const isOpen = expanded[t.symbol];
          const meta = impactOf(t.impact);
          const summary = summaryOf(t);
          const visibleSections = t.sections.filter(
            (s) => SHOW_FIELDS.some((f) => s.title.includes(f.replace("🌐", ""))) && !isEmptyField(s.body),
          );
          return (
            <div
              key={t.symbol}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${
                isOpen ? "border-accent/30" : "border-border"
              }`}
            >
              <button
                onClick={() => setExpanded((e) => ({ ...e, [t.symbol]: !e[t.symbol] }))}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-foreground/[0.02]"
                aria-expanded={isOpen}
              >
                {/* 左侧影响色条 */}
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-bold">{t.symbol}</span>
                    <span className={`rounded border px-2 py-0.5 font-mono text-[11px] ${meta.cls}`}>
                      影响 {t.impact}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-muted">
                      {isOpen ? "收起 ↑" : "展开 ↓"}
                    </span>
                  </div>
                  {!isOpen && summary && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/70">{summary}</p>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t-2 border-border/60 bg-foreground/[0.015] p-4">
                  {visibleSections.map((s) => (
                    <div key={s.title} className="border-l-2 border-accent/30 pl-3">
                      <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-widest text-accent">
                        {s.title}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{s.body}</div>
                    </div>
                  ))}
                  {visibleSections.length === 0 && (
                    <div className="font-mono text-xs text-muted">本条暂无更多细节。</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
