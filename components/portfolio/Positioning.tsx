"use client";

import { useEffect, useState } from "react";
import type { PositioningData, PositioningComponent } from "@/data/portfolio";

// 持仓与资金流：读 /data/positioning.json（gateway cron 推送）。
// 拥挤度综合分 + 四分量（COT资管/杠杆基金净仓、NAAIM暴露、CTA复制动量）+ CTA持仓表。

function crowdingColor(v: number): string {
  if (v >= 70) return "var(--loss)"; // 拥挤（偏空信号）
  if (v <= 30) return "var(--gain)"; // 燃料充足
  return "rgba(245,247,251,0.75)";
}

function fmtDate(d: string): string {
  return d || "—";
}

function fmtUpdatedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/New_York",
    });
  } catch {
    return "";
  }
}

// 拥挤度总分滑块：0燃料(绿) - 50 - 100拥挤(红)
function CrowdingSlider({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="mt-3">
      <div
        className="relative h-1.5 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--gain) 0%, rgba(245,247,251,0.25) 50%, var(--loss) 100%)",
        }}
      >
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-[var(--bg)]"
          style={{ left: `calc(${pct}% - 7px)`, borderColor: "rgba(245,247,251,0.9)" }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px]" style={{ color: "rgba(245,247,251,0.4)" }}>
        <span>0 燃料</span>
        <span>50</span>
        <span>100 拥挤</span>
      </div>
    </div>
  );
}

// 分量迷你滑块：当前分位数在 0-100 上的位置点
function ComponentSlider({ percentile }: { percentile: number | null }) {
  if (percentile == null) {
    return <div className="h-1 flex-1 rounded-full" style={{ background: "rgba(245,247,251,0.12)" }} />;
  }
  const pct = Math.min(100, Math.max(0, percentile));
  return (
    <div className="relative h-1 flex-1 rounded-full" style={{ background: "rgba(245,247,251,0.12)" }}>
      <div
        className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
        style={{ left: `calc(${pct}% - 4px)`, background: "rgba(245,247,251,0.75)" }}
      />
    </div>
  );
}

function ComponentRow({ c }: { c: PositioningComponent }) {
  const naaimNote = c.windowPoints === 0; // NAAIM 用固定阈值映射，非历史分位数
  return (
    <div className="flex items-center justify-between gap-3 py-2.5" style={{ borderTop: "1px solid rgba(245,247,251,0.08)" }}>
      <span className="w-28 shrink-0 truncate text-sm" style={{ color: "rgba(245,247,251,0.85)" }}>
        {c.label}
      </span>
      <span className="w-16 shrink-0 text-right font-mono text-sm font-bold">
        {c.value != null ? c.value : "—"}
      </span>
      <ComponentSlider percentile={c.percentile} />
      <span className="w-24 shrink-0 text-right text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
        {c.percentile != null ? `${naaimNote ? "阈值" : "3年"} ${c.percentile}%` : "—"}
      </span>
      <span className="w-20 shrink-0 text-right text-xs" style={{ color: "rgba(245,247,251,0.35)" }}>
        {fmtDate(c.date)}
      </span>
    </div>
  );
}

const REFRESH_MS = 30 * 60 * 1000; // 30 分钟自动刷新（分量更新频率本身是日/周级）

export default function Positioning() {
  const [data, setData] = useState<PositioningData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const load = () =>
    fetch(`/data/positioning.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PositioningData) => {
        setData(d);
        setState("ok");
      })
      .catch(() => setState((s) => (s === "loading" ? "off" : s)));

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/dashboard/positioning-refresh", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setRefreshMsg(body?.error || "刷新失败");
        return;
      }
      await load();
      setRefreshMsg("已刷新");
    } catch {
      setRefreshMsg("刷新失败，请稍后再试");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMsg(null), 4000);
    }
  };

  if (state === "off") return null;

  return (
    <>
      <div className="mt-8 flex items-center justify-between" data-reveal>
        <p className="pf-panel-title" style={{ margin: 0 }}>
          持仓与资金流
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
          {data && (
            <span>
              截至 {data.date}
              {data.updatedAt ? ` · 更新于 ${fmtUpdatedAt(data.updatedAt)}` : ""}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="border px-2 py-0.5 transition-colors hover:border-current disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "rgba(245,247,251,0.25)" }}
          >
            {refreshing ? "刷新中…" : "↻ 手动刷新"}
          </button>
          {refreshMsg && <span style={{ color: "var(--gain)" }}>{refreshMsg}</span>}
        </div>
      </div>

      {state === "loading" && (
        <div className="pf-panel mt-3 text-sm" data-reveal style={{ color: "rgba(245,247,251,0.5)" }}>
          持仓与资金流加载中…
        </div>
      )}

      {data && (
        <div className="pf-panel mt-3" data-reveal>
          {/* 拥挤度综合分 */}
          <div>
            <div className="text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
              拥挤度
            </div>
            {data.crowding != null ? (
              <>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold" style={{ color: crowdingColor(data.crowding) }}>
                    {data.crowding}%
                  </span>
                  <span className="text-xs" style={{ color: "rgba(245,247,251,0.4)" }}>
                    仅在极端区间作为战略 overlay
                  </span>
                </div>
                <CrowdingSlider value={data.crowding} />
              </>
            ) : (
              <div className="mt-1 text-sm" style={{ color: "rgba(245,247,251,0.4)" }}>
                分量数据不足，暂无法合成
              </div>
            )}
          </div>

          {/* 分量列表 */}
          <div className="mt-5">
            <div className="text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
              分量
            </div>
            <div className="mt-1">
              {data.components.map((c) => (
                <ComponentRow key={c.key} c={c} />
              ))}
              {data.components.length === 0 && (
                <div className="py-3 text-sm" style={{ color: "rgba(245,247,251,0.4)" }}>
                  暂无分量数据
                </div>
              )}
            </div>
          </div>

          {/* CTA 持仓表 */}
          {data.cta.length > 0 && (
            <div className="mt-5" style={{ borderTop: "1px solid rgba(245,247,251,0.08)" }}>
              <div className="flex items-center justify-between pt-4 text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
                <span>CTA</span>
                <span>混合</span>
              </div>
              <div className="mt-2 space-y-2">
                {data.cta.map((e) => (
                  <div key={e.symbol} className="flex items-center justify-between gap-3 text-sm">
                    <span className="w-14 shrink-0 font-mono font-bold">{e.symbol}</span>
                    <span
                      className="shrink-0 rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        background: e.signal === "long" ? "var(--gain)" : "rgba(245,247,251,0.3)",
                      }}
                    />
                    <span className="w-14 shrink-0 text-right font-mono">{e.weight.toFixed(3)}</span>
                    <span className="flex-1 text-right text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
                      现价 {e.price} · 50日线 {e.ma50}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
