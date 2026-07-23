"use client";

import { useEffect, useState } from "react";
import type { AssetCard, CrossAssetData } from "@/data/portfolio";

// 跨资产锚点墙：读 /data/cross-asset.json（gateway cron 推送）。
// 按分组平铺卡片，每卡：标签 + 涨跌% + 现价 + 迷你走势（inline SVG sparkline）。

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 10) return v.toFixed(2);
  return v.toFixed(2);
}

function changeColor(pct: number): string {
  if (pct > 0) return "var(--gain)";
  if (pct < 0) return "var(--loss)";
  return "rgba(245,247,251,0.6)";
}

// 迷你走势 SVG（旧→新），涨绿跌红
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return <div className="h-5" />;
  const w = 100;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stroke = up ? "var(--gain)" : "var(--loss)";
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${pts.join(" L ")}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
  const gid = `spk-${Math.round(data[0] * 100)}-${up ? "u" : "d"}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

function Card({ c }: { c: AssetCard }) {
  const up = c.changePct >= 0;
  return (
    <div className="pf-panel" style={{ padding: "0.55rem 0.7rem" }}>
      <div className="mb-0.5 text-[9px] uppercase tracking-wide" style={{ color: "rgba(245,247,251,0.35)" }}>
        {c.group}
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span
          className="truncate font-mono text-[11px] font-bold"
          style={{ color: "rgba(245,247,251,0.75)" }}
        >
          {c.label}
        </span>
        <span
          className="shrink-0 font-mono text-[11px] font-bold"
          style={{ color: changeColor(c.changePct) }}
        >
          {c.changePct > 0 ? "+" : ""}
          {c.changePct}%
        </span>
      </div>
      <div className="mt-0.5 font-mono text-base font-bold leading-tight">{fmtPrice(c.price)}</div>
      <div className="mt-1">
        <Sparkline data={c.spark} up={up} />
      </div>
    </div>
  );
}

// 更新时间：显示 HH:MM（美东时区，与行情一致）
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

const REFRESH_MS = 15 * 60 * 1000; // 15 分钟自动刷新

export default function CrossAsset() {
  const [data, setData] = useState<CrossAssetData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const load = () =>
    fetch(`/data/cross-asset.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: CrossAssetData) => {
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
      const res = await fetch("/api/dashboard/cross-asset-refresh", { method: "POST" });
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
          跨资产
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
          {data && (
            <span>
              {data.date}
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
          跨资产加载中…
        </div>
      )}

      {data && (
        <div className="mt-3 space-y-4" data-reveal>
          {/* 一句话市场总结 */}
          {data.summary && (
            <div
              className="pf-panel text-sm leading-relaxed"
              style={{ color: "rgba(245,247,251,0.8)" }}
            >
              {data.summary}
            </div>
          )}
          {/* 所有卡片连续密排（组名作为卡片内小标签） */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {(data.cards ?? []).map((c) => (
              <Card key={c.key} c={c} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
