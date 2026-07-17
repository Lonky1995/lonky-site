"use client";

import { useEffect, useState } from "react";

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

const IMPACT_CLS: Record<string, string> = {
  高: "border-red-500/50 text-red-500",
  中: "border-amber-500/50 text-amber-500",
  低: "border-muted text-muted",
};

// 只展示有价值的字段（KB 字段常为空，过滤掉纯占位）
const SHOW_FIELDS = ["🌐外部背景", "对 thesis 的影响", "价格/定位含义", "下一步观察点"];

function isEmptyField(body: string): boolean {
  return /^（.*不可达.*）$|^（.*无.*）$|^—$/.test(body.trim());
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

  const tickers = data?.tickers ?? [];

  return (
    <div className="space-y-6">
      {/* 日期 + 组合洞察 */}
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span className="text-accent">每日动态简报</span>
        <span>{data?.date || "—"}</span>
      </div>

      {data?.portfolioInsight && (
        <div className="border-2 border-accent/30 bg-accent/[0.04] p-5">
          <div className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">组合层面洞察</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {data.portfolioInsight}
          </div>
        </div>
      )}

      {/* 按标的卡片 */}
      <div className="space-y-3">
        {tickers.map((t) => {
          const isOpen = expanded[t.symbol];
          const bg = t.sections.find((s) => s.title.includes("外部背景") && !isEmptyField(s.body));
          const summary = bg?.body.slice(0, 90) ?? t.sections.find((s) => !isEmptyField(s.body))?.body.slice(0, 90) ?? "";
          return (
            <div key={t.symbol} className="border-2 border-border">
              <button
                onClick={() => setExpanded((e) => ({ ...e, [t.symbol]: !e[t.symbol] }))}
                className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-foreground/[0.02]"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold">{t.symbol}</span>
                  <span className={`border px-2 py-0.5 font-mono text-[11px] ${IMPACT_CLS[t.impact] ?? IMPACT_CLS["低"]}`}>
                    影响 {t.impact}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-muted">{isOpen ? "收起 ↑" : "展开 ↓"}</span>
                </div>
                {!isOpen && summary && (
                  <div className="truncate text-sm text-foreground/70">{summary}…</div>
                )}
              </button>

              {isOpen && (
                <div className="space-y-4 border-t-2 border-border p-4">
                  {t.sections
                    .filter((s) => SHOW_FIELDS.some((f) => s.title.includes(f.replace("🌐", ""))) && !isEmptyField(s.body))
                    .map((s) => (
                      <div key={s.title}>
                        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-accent">{s.title}</div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{s.body}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
