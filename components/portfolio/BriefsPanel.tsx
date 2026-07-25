"use client";

import { useEffect, useState } from "react";

// 每日关注简报：读取持仓动态目录中的最新简报，按标的卡片展示。

type Section = { title: string; body: string };
type TickerBlock = { symbol: string; impact: string; sections: Section[] };
type BriefData = {
  date: string;
  tickers: TickerBlock[];
  intro?: string;
  portfolioInsight: string;
  omittedNote?: string;
  blindSpot?: string;
  availableDates?: string[];
  error?: string;
};

const IMPACT_CLS: Record<string, string> = {
  高: "border-red-500/50 text-red-500",
  中: "border-amber-500/50 text-amber-500",
  低: "border-muted text-muted",
};

// 只展示有价值的字段（KB 字段常为空，过滤掉纯占位）
const SHOW_FIELDS = [
  "关键事实",
  "上下游 + 竞品",
  "外部背景",
  "来源",
  "对 thesis 的影响",
  "价格/定位含义",
  "下一步观察点",
];

function isEmptyField(body: string): boolean {
  return /^（.*不可达.*）$|^（.*无.*）$|^—$/.test(body.trim());
}

function plainText(markdown: string): string {
  return markdown.replace(/\*\*/g, "").trim();
}

export default function BriefsPanel() {
  const [data, setData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/portfolio/briefs")
      .then((r) => r.json())
      .then((d: BriefData) => {
        setData(d);
        const firstSymbol = d.tickers?.[0]?.symbol;
        if (firstSymbol) setExpanded({ [firstSymbol]: true });
      })
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
      {/* 日期 */}
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span className="text-accent">每日关注简报</span>
        <span>{data?.date || "—"}</span>
      </div>

      {data?.intro && (
        <div className="border border-border bg-foreground/[0.025] px-4 py-3 text-sm leading-relaxed text-foreground/70">
          {plainText(data.intro)}
        </div>
      )}

      <section aria-labelledby="brief-core-title">
        <h3 id="brief-core-title" className="mb-3 text-sm font-bold text-foreground">
          核心增量 · 按影响排序
        </h3>

        <div className="space-y-3">
          {tickers.map((t) => {
            const isOpen = expanded[t.symbol];
            const bg = t.sections.find((s) => s.title.includes("外部背景") && !isEmptyField(s.body));
            const summarySource =
              bg?.body ?? t.sections.find((s) => !isEmptyField(s.body))?.body ?? "";
            const summary = plainText(summarySource).slice(0, 90);
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
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                            {plainText(s.body)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {data?.omittedNote && (
        <p className="text-xs leading-relaxed text-muted">
          {plainText(data.omittedNote)}
        </p>
      )}

      {data?.portfolioInsight && (
        <section aria-labelledby="portfolio-insight-title" className="border-2 border-accent/30 bg-accent/[0.04] p-5">
          <h3 id="portfolio-insight-title" className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            组合层面洞察
          </h3>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {plainText(data.portfolioInsight)}
          </div>
        </section>
      )}

      {data?.blindSpot && (
        <div className="border border-border px-4 py-3 text-sm leading-relaxed text-foreground/75">
          <span className="font-semibold text-foreground">盲区提示：</span>
          {plainText(data.blindSpot)}
        </div>
      )}
    </div>
  );
}
