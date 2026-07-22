"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
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

// 五因子数据口径与解读（hover 提示用）。口径来自 gateway/posture-snapshot 计算逻辑。
const FACTOR_GUIDE: Record<string, { source: string; how: string }> = {
  trend: {
    source: "SPY 相对 200 日均线的偏离幅度",
    how: "在均线上方 = 长期多头趋势，越高越强",
  },
  credit: {
    source: "HYG / LQD 比值（高收益债 vs 投资级债）的历史百分位",
    how: "比值越高 = 信用越松、风险偏好越强",
  },
  vol: {
    source: "VIX 恐慌指数的历史百分位（反向）",
    how: "VIX 越低 = 波动越可控，得分越高",
  },
  leadership: {
    source: "Mag7 龙头篮子相对 SPY 的 20 日超额收益",
    how: "超额为正 = 龙头带队上涨，市场结构健康",
  },
  breadth: {
    source: "上涨股票占比等市场广度指标",
    how: "越高 = 参与度越广，涨势不只靠少数龙头",
  },
};

export default function MarketBreadth() {
  const [p, setP] = useState<PostureData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");

  useEffect(() => {
    fetch(`/data/posture.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PostureData) => {
        setP(d);
        setState("ok");
      })
      .catch(() => setState("off"));
  }, []);

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
            {/* 顶部：姿态总分 + 判断（左）｜ 7天迷你走势（右） */}
            <div className="flex items-center justify-between gap-4 pb-4">
              <div className="shrink-0">
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
                <div
                  className="mt-1 text-xs leading-relaxed"
                  style={{ color: "rgba(245,247,251,0.55)" }}
                >
                  {verdictNote(p.score)}
                </div>
              </div>

              {/* 7天迷你走势：紧凑，无坐标轴，仅示意趋势 */}
              {chartData.length > 1 && (
                <div className="min-w-0 w-full max-w-[280px]">
                  <div className="mb-1 text-right">
                    <span className="pf-chip">7 天姿态</span>
                  </div>
                  <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                      <defs>
                        <linearGradient id="postureFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a8b4ff" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#a8b4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          background: "rgba(9,11,17,0.92)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#f5f7fb",
                        }}
                        labelFormatter={(t) => `${t}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#a8b4ff"
                        strokeWidth={2}
                        fill="url(#postureFill)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 五因子：横向进度条平铺 */}
            <div className="grid gap-x-8 gap-y-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.factors.map((f) => {
                const guide = FACTOR_GUIDE[f.key];
                return (
                  <div key={f.key} className="group relative flex items-center gap-3">
                    {/* 标签（带下划虚线，提示可 hover） */}
                    <span
                      className="w-12 shrink-0 cursor-help text-[13px] decoration-dotted underline-offset-4 group-hover:underline"
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

                    {/* hover 口径提示卡片 */}
                    {guide && (
                      <div
                        className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-64 rounded-xl p-3 text-xs leading-relaxed opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                        style={{
                          background: "rgba(9,11,17,0.96)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(245,247,251,0.85)",
                        }}
                      >
                        <div className="mb-1 font-bold" style={{ color: "rgba(245,247,251,0.95)" }}>
                          {f.label} · {f.score}
                        </div>
                        <div className="mb-1">
                          <span style={{ color: "rgba(245,247,251,0.45)" }}>数据口径：</span>
                          {guide.source}
                        </div>
                        <div>
                          <span style={{ color: "rgba(245,247,251,0.45)" }}>怎么看：</span>
                          {guide.how}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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

          </>
        )}
      </div>
    </>
  );
}
