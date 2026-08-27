"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryPoint, IntervalKey, IntervalMetrics } from "@/types/crypto-breadth";
import { fmtPct } from "@/lib/crypto-breadth/format";

const INTERVAL_LABEL: Record<IntervalKey, string> = { "15m": "15分钟", "1h": "1小时", "4h": "4小时" };

export default function BreadthMatrix({
  intervals,
  history,
}: {
  intervals: Record<IntervalKey, IntervalMetrics>;
  history: HistoryPoint[];
}) {
  const chartData = (history ?? []).map((h) => ({
    t: h.t?.slice(5, 16).replace("T", " "),
    breadth: h.breadth,
    risk: h.risk,
  }));

  return (
    <div className="flex flex-col gap-4" data-reveal>
      <div>
        <p className="pf-panel-title">市场结构广度</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.keys(INTERVAL_LABEL) as IntervalKey[]).map((k) => {
            const m = intervals?.[k];
            if (!m) return null;
            return (
              <div key={k} className="pf-panel">
                <div className="pf-panel-title" style={{ margin: 0 }}>
                  {INTERVAL_LABEL[k]}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>上涨占比</div>
                    <div className="font-mono text-sm font-bold text-white">{fmtPct(m.positive, 1)}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>跑赢 BTC</div>
                    <div className="font-mono text-sm font-bold text-white">{fmtPct(m.beat_btc, 1)}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>站上 EMA20</div>
                    <div className="font-mono text-sm font-bold text-white">{fmtPct(m.above_ema20, 1)}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>广度综合分</div>
                    <div className="font-mono text-sm font-bold text-white">{m.breadth?.toFixed(1) ?? "—"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="pf-panel">
          <p className="pf-panel-title" style={{ margin: 0 }}>
            1H 广度 / 风险走势（近 240 根）
          </p>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="breadthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a8b4ff" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#a8b4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "rgba(245,247,251,0.4)" }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    background: "rgba(9,11,17,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    color: "#f5f7fb",
                  }}
                />
                <Area type="monotone" dataKey="breadth" name="广度" stroke="#a8b4ff" strokeWidth={2} fill="url(#breadthFill)" isAnimationActive={false} />
                <Area type="monotone" dataKey="risk" name="风险" stroke="#ff453a" strokeWidth={1.5} fillOpacity={0} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
