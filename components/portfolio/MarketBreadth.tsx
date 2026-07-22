"use client";

import { useEffect, useState } from "react";
import type { BreadthData } from "@/data/portfolio";

// 市场广度卡片：读 /data/breadth.json（gateway cron 收盘后推送）。
// 广度是"市场层"判断（大盘健不健康），与持仓层分开，放在资产总览之后。

// 合成分分档 → 一句话判断（结论先行）
function verdict(score: number): { label: string; tone: "gain" | "loss" | "neutral"; note: string } {
  if (score >= 75) {
    return { label: "强势", tone: "gain", note: "广度健康，普涨环境，可积极。" };
  }
  if (score >= 55) {
    return { label: "中性", tone: "neutral", note: "趋势尚在但选择性，追高需谨慎。" };
  }
  return { label: "谨慎", tone: "loss", note: "广度走弱，涨势变窄，宜收手。" };
}

function toneColor(tone: "gain" | "loss" | "neutral"): string {
  if (tone === "gain") return "var(--gain)";
  if (tone === "loss") return "var(--loss)";
  return "rgba(245,247,251,0.85)";
}

export default function MarketBreadth() {
  const [b, setB] = useState<BreadthData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");

  useEffect(() => {
    fetch(`/data/breadth.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: BreadthData) => {
        setB(d);
        setState("ok");
      })
      .catch(() => setState("off"));
  }, []);

  // 数据未接入时不占版面
  if (state === "off") return null;

  const v = b ? verdict(b.breadthScore) : null;

  return (
    <>
      <div className="mt-8 flex items-center justify-between" data-reveal>
        <p className="pf-panel-title" style={{ margin: 0 }}>
          市场环境
        </p>
        {b && (
          <span className="text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
            {b.universe} · {b.date}
          </span>
        )}
      </div>

      <div className="pf-panel mt-3" data-reveal>
        {state === "loading" && (
          <div className="text-sm" style={{ color: "rgba(245,247,251,0.5)" }}>
            广度数据加载中…
          </div>
        )}

        {b && v && (
          <>
            <div
              className="pf-kpi-grid"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginTop: 0 }}
            >
              <div className="pf-kpi">
                <div className="pf-kpi-label">广度评分</div>
                <div className="pf-kpi-value" style={{ color: toneColor(v.tone) }}>
                  {b.breadthScore}
                </div>
                <div className="mt-1 text-[11px]" style={{ color: toneColor(v.tone) }}>
                  {v.label}
                </div>
              </div>

              <div className="pf-kpi">
                <div className="pf-kpi-label">站上 200 日线</div>
                <div className="pf-kpi-value">{b.pctAbove200.toFixed(1)}%</div>
                <div className="mt-1 text-[11px]" style={{ color: "rgba(245,247,251,0.45)" }}>
                  长期趋势
                </div>
              </div>

              <div className="pf-kpi">
                <div className="pf-kpi-label">站上 50 日线</div>
                <div className="pf-kpi-value">{b.pctAbove50.toFixed(1)}%</div>
                <div className="mt-1 text-[11px]" style={{ color: "rgba(245,247,251,0.45)" }}>
                  短期动能
                </div>
              </div>

              <div className="pf-kpi">
                <div className="pf-kpi-label">涨跌家数</div>
                <div
                  className={`pf-kpi-value ${b.adDiff >= 0 ? "gain" : "loss"}`}
                >
                  {b.advancers}/{b.decliners}
                </div>
                <div
                  className="mt-1 text-[11px]"
                  style={{ color: b.adDiff >= 0 ? "var(--gain)" : "var(--loss)" }}
                >
                  {b.adDiff >= 0 ? "+" : ""}
                  {b.adDiff}
                </div>
              </div>
            </div>

            <div
              className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed"
              style={{ color: "rgba(245,247,251,0.72)" }}
            >
              <span className="pf-chip" style={{ marginRight: 8 }}>
                解读
              </span>
              {v.note}
            </div>
          </>
        )}
      </div>
    </>
  );
}
