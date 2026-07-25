"use client";

import { useEffect, useState } from "react";

// 重点日历：数据源 Obsidian vault（trading/事件日历/*.md，用户手工维护）。
// gateway 每天拉取解析 → /data/events.json。

type CalEvent = {
  date: string; // YYYY-MM-DD
  title: string;
  impact: "high" | "mid" | "low";
  symbol: string;
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function weekdayCn(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
}

// 影响 → 颜色 token
const IMPACT_META = {
  high: { label: "高", cls: "border-red-500/50 text-red-500", bar: "var(--loss)" },
  mid: { label: "中", cls: "border-amber-500/50 text-amber-500", bar: "#e5a800" },
  low: { label: "低", cls: "border-muted text-muted", bar: "rgba(245,247,251,0.4)" },
} as const;

export default function CalendarPanel() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [genDate, setGenDate] = useState("");

  useEffect(() => {
    fetch(`/data/events.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { events?: CalEvent[]; generatedAt?: string }) => {
        setEvents(d.events ?? []);
        setGenDate(d.generatedAt ?? "");
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center font-mono text-sm text-muted">加载日历中…</div>;
  }

  const upcoming = events
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span className="text-accent">重点日历 · 财报/宏观/事件</span>
        <span>来源 vault {genDate || "—"}</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="border-2 border-border p-6 text-sm text-muted">
          暂无临近事件。日历数据来自 Obsidian vault 的「事件日历」笔记，维护后每天自动同步。
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((e, i) => {
            const dLeft = daysUntil(e.date);
            const meta = IMPACT_META[e.impact] ?? IMPACT_META.low;
            return (
              <div
                key={`${e.symbol}-${e.date}-${i}`}
                className="flex items-center gap-4 border-2 border-border p-4"
              >
                {/* 影响色条 */}
                <div
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ background: meta.bar }}
                />
                {/* 日期块 */}
                <div className="flex w-16 shrink-0 flex-col items-center border-r-2 border-border pr-4 font-mono">
                  <span className="text-lg font-bold">{e.date.slice(5).replace("-", "/")}</span>
                  <span className="text-[10px] text-muted">周{weekdayCn(e.date)}</span>
                </div>
                {/* 内容 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{e.symbol}</span>
                    <span className={`border px-2 py-0.5 font-mono text-[10px] ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {dLeft === 0 ? "今天" : `${dLeft} 天后`}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm text-foreground/80">{e.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
