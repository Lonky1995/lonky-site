"use client";

import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import type { PostureData } from "@/data/portfolio";

// 市场环境卡片：读 /data/posture.json（gateway cron 收盘后推送）。
// 顶部姿态总分 + 五因子小格 + 最近7天走势曲线（总分/各因子可切换）。

function verdictTone(score: number): "gain" | "loss" | "neutral" {
  if (score >= 70) return "gain";
  if (score >= 50) return "neutral";
  return "loss";
}

function verdictNote(score: number): string {
  if (score >= 70) return "多数因子健康，可积极。";
  if (score >= 50) return "有支撑但需选择，追高谨慎。";
  return "多数因子走弱，宜收手观望。";
}

function toneColor(tone: "gain" | "loss" | "neutral"): string {
  if (tone === "gain") return "var(--gain)";
  if (tone === "loss") return "var(--loss)";
  return "rgba(245,247,251,0.85)";
}

function factorColor(score: number): string {
  if (score >= 60) return "var(--gain)";
  if (score < 40) return "var(--loss)";
  return "rgba(245,247,251,0.85)";
}

// 曲线可切换的维度：总分 + 五因子
const SERIES = [
  { key: "score", label: "总分" },
  { key: "trend", label: "趋势" },
  { key: "credit", label: "信用" },
  { key: "vol", label: "波动" },
  { key: "leadership", label: "领导力" },
  { key: "breadth", label: "广度" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

export default function MarketBreadth() {
  const [p, setP] = useState<PostureData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");
  const [sel, setSel] = useState<SeriesKey>("score");
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(0);

  useEffect(() => {
    fetch(`/data/posture.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PostureData) => {
        setP(d);
        setState("ok");
      })
      .catch(() => setState("off"));
  }, []);

  useEffect(() => {
    const measure = () => {
      if (chartRef.current) setChartW(chartRef.current.clientWidth);
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [p]);

  if (state === "off") return null;

  const tone = p ? verdictTone(p.score) : "neutral";
  const history = p?.history ?? [];
  const chartData = history.map((h) => ({
    t: h.date.slice(5), // MM-DD
    v: h[sel],
  }));

  return (
    <>
      <div className="mt-8 flex items-center justify-between" data-reveal>
        <p className="pf-panel-title" style={{ margin: 0 }}>
          市场环境
        </p>
        {p && (
          <span className="text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
            五因子 · {p.date}
          </span>
        )}
      </div>

      <div className="pf-panel mt-3" data-reveal>
        {state === "loading" && (
          <div className="text-sm" style={{ color: "rgba(245,247,251,0.5)" }}>
            市场姿态加载中…
          </div>
        )}

        {p && (
          <>
            {/* 顶部：姿态总分 + 判断 */}
            <div className="flex items-end justify-between gap-4 pb-4">
              <div>
                <div className="pf-kpi-label">市场姿态</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span
                    className="font-mono font-bold"
                    style={{ fontSize: "2.6rem", lineHeight: 1, color: toneColor(tone) }}
                  >
                    {p.score}
                  </span>
                  <span className="font-mono text-sm" style={{ color: toneColor(tone) }}>
                    {p.verdict}
                  </span>
                </div>
              </div>
              <div
                className="max-w-[52%] text-right text-sm leading-relaxed"
                style={{ color: "rgba(245,247,251,0.6)" }}
              >
                {verdictNote(p.score)}
              </div>
            </div>

            {/* 五因子横排 */}
            <div
              className="grid gap-3 border-t border-white/10 pt-4"
              style={{ gridTemplateColumns: `repeat(${p.factors.length}, minmax(0, 1fr))` }}
            >
              {p.factors.map((f) => (
                <div key={f.key}>
                  <div className="pf-kpi-label">{f.label}</div>
                  <div
                    className="mt-1 font-mono text-2xl font-bold"
                    style={{ color: factorColor(f.score) }}
                  >
                    {f.score}
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: "rgba(245,247,251,0.45)" }}>
                    {f.note}
                  </div>
                </div>
              ))}
            </div>

            {/* 7天走势曲线 */}
            {chartData.length > 1 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="pf-chip" style={{ marginRight: 4 }}>
                    7 天走势
                  </span>
                  {SERIES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSel(s.key)}
                      className="font-mono text-[11px] uppercase tracking-widest transition-colors"
                      style={{
                        color:
                          sel === s.key ? "var(--accent)" : "rgba(245,247,251,0.4)",
                        borderBottom:
                          sel === s.key
                            ? "1px solid var(--accent)"
                            : "1px solid transparent",
                        paddingBottom: 2,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div ref={chartRef} className="min-w-0">
                  {chartW > 0 && (
                    <AreaChart width={chartW} height={140} data={chartData}>
                      <defs>
                        <linearGradient id="postureFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a8b4ff" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#a8b4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="t"
                        tick={{ fontSize: 11, fill: "rgba(245,247,251,0.45)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 50, 100]}
                        tick={{ fontSize: 11, fill: "rgba(245,247,251,0.45)" }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          background: "rgba(9,11,17,0.92)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#f5f7fb",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#a8b4ff"
                        strokeWidth={2}
                        fill="url(#postureFill)"
                      />
                    </AreaChart>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
