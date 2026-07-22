"use client";

import { useEffect, useState } from "react";
import type { PostureData } from "@/data/portfolio";

// 市场环境卡片：读 /data/posture.json（gateway cron 收盘后推送）。
// 顶部一个 0-100 姿态总分（"今天该不该动手"），下面五因子小格。
// 广度已作为 posture 的一个因子并入，不再单独读 breadth.json。

// 总分分档 → 一句话判断（结论先行）
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

// 单因子分数 → 颜色（60+ 绿 / 40- 红 / 中间中性）
function factorColor(score: number): string {
  if (score >= 60) return "var(--gain)";
  if (score < 40) return "var(--loss)";
  return "rgba(245,247,251,0.85)";
}

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

  // 数据未接入时不占版面
  if (state === "off") return null;

  const tone = p ? verdictTone(p.score) : "neutral";

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
          </>
        )}
      </div>
    </>
  );
}
