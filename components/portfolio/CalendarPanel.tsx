"use client";

import { useEffect, useState } from "react";

// 重点日历：从 Grok 简报「下一步观察点」提取的财报/派息/宏观事件，按日期排序。

type CalEvent = { date: string; mdRaw: string; symbol: string; text: string };

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

export default function CalendarPanel() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefDate, setBriefDate] = useState("");

  useEffect(() => {
    fetch("/api/portfolio/briefs")
      .then((r) => r.json())
      .then((d: { events?: CalEvent[]; date?: string }) => {
        setEvents(d.events ?? []);
        setBriefDate(d.date ?? "");
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center font-mono text-sm text-muted">加载日历中…</div>;
  }

  // 只显示今天及以后的事件
  const upcoming = events.filter((e) => daysUntil(e.date) >= 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span className="text-accent">重点日历 · 财报/派息/事件</span>
        <span>来源简报 {briefDate || "—"}</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="border-2 border-border p-6 text-sm text-muted">
          暂无临近事件。日历从 Grok 简报的「下一步观察点」自动提取，简报更新后刷新。
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((e, i) => {
            const dLeft = daysUntil(e.date);
            const urgent = dLeft <= 3;
            return (
              <div
                key={`${e.symbol}-${e.date}-${i}`}
                className={`flex items-center gap-4 border-2 p-4 ${urgent ? "border-amber-500/50 bg-amber-500/[0.05]" : "border-border"}`}
              >
                {/* 日期块 */}
                <div className="flex w-16 shrink-0 flex-col items-center border-r-2 border-border pr-4 font-mono">
                  <span className="text-lg font-bold">{e.date.slice(5).replace("-", "/")}</span>
                  <span className="text-[10px] text-muted">周{weekdayCn(e.date)}</span>
                </div>
                {/* 内容 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{e.symbol}</span>
                    <span
                      className={`border px-2 py-0.5 font-mono text-[10px] ${
                        urgent ? "border-amber-500/50 text-amber-500" : "border-muted text-muted"
                      }`}
                    >
                      {dLeft === 0 ? "今天" : `${dLeft} 天后`}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm text-foreground/80">{e.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
