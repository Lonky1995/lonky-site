"use client";

import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import type { PostureData } from "@/data/portfolio";

// 市场环境卡片：读 /data/posture.json（gateway cron 收盘后推送）。
// 顶部姿态总分 + 五因子横向进度条平铺 + 最近7天总分走势曲线。

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

// 因子分数 → 进度条颜色（≥60 绿 / 40-60 黄 / <40 红）
function barColor(score: number): string {
  if (score >= 60) return "var(--gain)";
  if (score >= 40) return "#e5a800";
  return "var(--loss)";
}

export default function MarketBreadth() {
  const [p, setP] = useState<PostureData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");
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
    v: h.score,
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

            {/* 五因子：横向进度条平铺 */}
            <div className="grid gap-x-8 gap-y-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.factors.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  {/* 标签 */}
                  <span
                    className="w-12 shrink-0 text-[13px]"
                    style={{ color: "rgba(245,247,251,0.7)" }}
                  >
                    {f.label}
                  </span>
                  {/* 进度条 */}
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, f.score))}%`,
                        background: barColor(f.score),
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  {/* 数值 */}
                  <span
                    className="w-7 shrink-0 text-right font-mono text-sm font-bold"
                    style={{ color: barColor(f.score) }}
                  >
                    {f.score}
                  </span>
                </div>
              ))}
            </div>

            {/* 因子状态注释（一行小字，对应参考图的"部分"提示） */}
            <div
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]"
              style={{ color: "rgba(245,247,251,0.4)" }}
            >
              {p.factors.map((f) => (
                <span key={f.key}>
                  {f.label} · {f.note}
                </span>
              ))}
            </div>

            {/* 7天总分走势曲线 */}
            {chartData.length > 1 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="mb-2">
                  <span className="pf-chip">7 天姿态走势</span>
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
