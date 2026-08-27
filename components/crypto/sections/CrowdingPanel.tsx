"use client";

import { useState } from "react";
import type { BtcCrowding, CrowdingHorizon } from "@/types/crypto-breadth";
import { fmtNum, fmtPct, toneOf } from "@/lib/crypto-breadth/format";

function heatColor(v: number): string {
  if (v >= 80) return "var(--loss)";
  if (v >= 60) return "#e5a800";
  return "var(--gain)";
}

function HorizonDetail({ h }: { h: CrowdingHorizon }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="pf-kpi">
        <div className="pf-kpi-label">杠杆热度（三年分位）</div>
        <div className="pf-kpi-value" style={{ color: heatColor(h.leverage_heat) }}>
          {fmtNum(h.leverage_heat, 1)}
        </div>
      </div>
      <div className="pf-kpi">
        <div className="pf-kpi-label">方向拥挤</div>
        <div className={`pf-kpi-value ${toneOf(h.direction_score) === "gain" ? "gain" : toneOf(h.direction_score) === "loss" ? "loss" : ""}`}>
          {fmtNum(h.direction_score, 1)}
        </div>
      </div>
      <div className="pf-kpi">
        <div className="pf-kpi-label">资金费率</div>
        <div className={`pf-kpi-value ${toneOf(h.funding_rate_pct) === "gain" ? "gain" : toneOf(h.funding_rate_pct) === "loss" ? "loss" : ""}`}>
          {fmtPct(h.funding_rate_pct, 4)}
        </div>
      </div>
      <div className="pf-kpi">
        <div className="pf-kpi-label">跨交易所同向确认</div>
        <div className="pf-kpi-value">
          {h.cross_exchange_confirmation_count ?? "—"}/{h.cross_exchange_confirmation_total ?? "—"}
        </div>
      </div>
      <div className="col-span-2 pf-panel sm:col-span-4" style={{ background: "rgba(255,255,255,0.03)" }}>
        <p className="text-sm" style={{ color: "rgba(245,247,251,0.65)" }}>
          {h.conclusion}
        </p>
        {h.backtest && (
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(245,247,251,0.4)" }}>
            回测（{h.backtest.forward_window}）：多头拥挤事件 {h.backtest.long_crowded.events} 次，中位远期收益{" "}
            {fmtPct(h.backtest.long_crowded.median_forward_pct, 2)}；空头拥挤事件{" "}
            {h.backtest.short_crowded.events} 次，中位远期收益 {fmtPct(h.backtest.short_crowded.median_forward_pct, 2)}；
            基准中位收益 {fmtPct(h.backtest.baseline_median_forward_pct, 2)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CrowdingPanel({ data }: { data: BtcCrowding }) {
  const horizons = data?.horizons ?? [];
  const [active, setActive] = useState(data?.primary_window ?? horizons[0]?.window);
  const current = horizons.find((h) => h.window === active) ?? horizons[0];

  if (!data?.available || !current) return null;

  return (
    <div data-reveal>
      <p className="pf-panel-title">BTC 持仓拥挤度</p>
      <div className="pf-panel mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-white">{data.headline}</h3>
          <div className="flex gap-1">
            {horizons.map((h) => (
              <button
                key={h.window}
                onClick={() => setActive(h.window)}
                className="pf-chip"
                style={{
                  cursor: "pointer",
                  background: h.window === active ? "rgba(168,180,255,0.16)" : undefined,
                  borderColor: h.window === active ? "rgba(168,180,255,0.5)" : undefined,
                  color: h.window === active ? "#a8b4ff" : undefined,
                }}
              >
                {h.window}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,251,0.6)" }}>
          {data.summary}
        </p>
        <HorizonDetail h={current} />
      </div>
    </div>
  );
}
