"use client";

import { useMemo, useState } from "react";
import type { Position } from "@/data/portfolio";

// 风险管理卡片：
//   ② 组合热度 —— 所有持仓"到止损总亏损" / 总资产，对比上限
//   ① 开仓助手 —— 输入止损价，按单笔风险% 反推最多买多少股
// 纯前端计算，数据来自 Dashboard（持仓、现价、总资产）。

type Props = {
  positions: Position[];
  priceOf: (sym: string) => number | null;
  totalAssets: number | null; // 总资产（持仓市值+现金），组合热度分母
};

const HEAT_CAP = 6; // 组合热度上限 %（业界常用 6%）

function num(s?: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function fmtUsd(v: number | null): string {
  if (v === null) return "—";
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// 单笔到止损的亏损额（美元），做空取反。无止损/无数量返回 null。
function riskOf(p: Position): number | null {
  const qty = num(p.size);
  const entry = num(p.entryPrice);
  const stop = num(p.stopLoss);
  if (qty === null || entry === null || stop === null) return null;
  const perShare = p.direction === "long" ? entry - stop : stop - entry;
  return Math.max(0, perShare * qty); // 只计正向风险
}

export default function RiskPanel({ positions, priceOf, totalAssets }: Props) {
  // 开仓助手输入
  const [riskPct, setRiskPct] = useState("1");
  const [symbol, setSymbol] = useState("");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");

  // ── ② 组合热度 ──
  const heat = useMemo(() => {
    let totalRisk = 0;
    let counted = 0;
    let missing = 0;
    const detail: { symbol: string; risk: number }[] = [];
    for (const p of positions) {
      const r = riskOf(p);
      if (r === null) {
        missing++;
        continue;
      }
      totalRisk += r;
      counted++;
      detail.push({ symbol: p.symbol, risk: r });
    }
    const base = totalAssets && totalAssets > 0 ? totalAssets : null;
    const heatPct = base ? (totalRisk / base) * 100 : null;
    return { totalRisk, heatPct, counted, missing, detail };
  }, [positions, totalAssets]);

  // ── ① 开仓助手 ──
  const calc = useMemo(() => {
    const rPct = num(riskPct);
    const e = num(entry);
    const s = num(stop);
    const base = totalAssets && totalAssets > 0 ? totalAssets : null;
    if (rPct === null || e === null || s === null || base === null) return null;
    const perShare = Math.abs(e - s);
    if (perShare <= 0) return null;
    const riskBudget = base * (rPct / 100); // 允许亏损额
    const shares = Math.floor(riskBudget / perShare);
    const positionValue = shares * e;
    return {
      shares,
      riskBudget,
      positionValue,
      pctOfAccount: (positionValue / base) * 100,
    };
  }, [riskPct, entry, stop, totalAssets]);

  const heatOver = heat.heatPct !== null && heat.heatPct > HEAT_CAP;
  const heatColor =
    heat.heatPct === null
      ? "rgba(245,247,251,0.85)"
      : heatOver
        ? "var(--loss)"
        : heat.heatPct > HEAT_CAP * 0.7
          ? "#e5a800"
          : "var(--gain)";

  const inputCls =
    "w-full border-2 border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none";

  return (
    <>
      <div className="mt-8 flex items-center justify-between" data-reveal>
        <p className="pf-panel-title" style={{ margin: 0 }}>
          风险管理
        </p>
        <span className="text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
          单笔风险上限 {riskPct || "1"}% · 组合上限 {HEAT_CAP}%
        </span>
      </div>

      <div className="pf-panel mt-3" data-reveal>
        {/* ② 组合热度 */}
        <div
          className="pf-kpi-grid"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: 0 }}
        >
          <div className="pf-kpi">
            <div className="pf-kpi-label">组合热度</div>
            <div className="pf-kpi-value" style={{ color: heatColor }}>
              {heat.heatPct === null ? "—" : `${heat.heatPct.toFixed(1)}%`}
            </div>
            <div className="mt-1 text-[11px]" style={{ color: "rgba(245,247,251,0.45)" }}>
              上限 {HEAT_CAP}%
            </div>
          </div>
          <div className="pf-kpi">
            <div className="pf-kpi-label">到止损总亏损</div>
            <div className="pf-kpi-value loss">{fmtUsd(-heat.totalRisk)}</div>
            <div className="mt-1 text-[11px]" style={{ color: "rgba(245,247,251,0.45)" }}>
              {heat.counted} 笔计入
            </div>
          </div>
          <div className="pf-kpi">
            <div className="pf-kpi-label">风险状态</div>
            <div className="pf-kpi-value" style={{ color: heatColor }}>
              {heat.heatPct === null ? "缺数据" : heatOver ? "超限" : "受控"}
            </div>
            {heat.missing > 0 && (
              <div className="mt-1 text-[11px]" style={{ color: "rgba(245,247,251,0.45)" }}>
                {heat.missing} 笔无止损未计
              </div>
            )}
          </div>
        </div>

        {/* 每笔明细 */}
        {heat.detail.length > 0 && (
          <div
            className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[11px]"
            style={{ color: "rgba(245,247,251,0.55)" }}
          >
            {heat.detail.map((d) => (
              <span key={d.symbol}>
                <span className="font-mono" style={{ color: "rgba(245,247,251,0.85)" }}>
                  {d.symbol}
                </span>{" "}
                到止损亏 {fmtUsd(d.risk)}
                {totalAssets ? `（${((d.risk / totalAssets) * 100).toFixed(0)}%）` : ""}
              </span>
            ))}
          </div>
        )}

        {/* ① 开仓助手 */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="pf-chip">开仓助手 · 按风险算股数</span>
            <label className="flex items-center gap-2 text-[11px] text-muted">
              单笔风险
              <input
                type="number"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                className="w-14 border-2 border-border bg-transparent px-2 py-1 text-center font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                step="0.5"
                min="0.1"
              />
              %
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-muted">
                代码
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="如 NVDA"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-muted">
                预计入场价
              </label>
              <input
                type="number"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-muted">
                止损价
              </label>
              <input
                type="number"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
          </div>

          {/* 结果 */}
          {calc && (
            <div
              className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/10 pt-4"
            >
              <div>
                <span className="text-[11px] text-muted">最多可买 </span>
                <span className="font-mono text-2xl font-bold" style={{ color: "var(--accent)" }}>
                  {calc.shares}
                </span>
                <span className="text-[11px] text-muted"> 股</span>
              </div>
              <div className="text-xs text-muted">
                仓位约 <span className="text-foreground">{fmtUsd(calc.positionValue)}</span>
                （账户 {calc.pctOfAccount.toFixed(1)}%）
              </div>
              <div className="text-xs text-muted">
                风险预算 <span className="text-foreground">{fmtUsd(calc.riskBudget)}</span>
              </div>
            </div>
          )}
          {!calc && (symbol || entry || stop) && (
            <div className="mt-3 text-[11px]" style={{ color: "rgba(245,247,251,0.45)" }}>
              填入场价与止损价即可计算（需已设置现金/持仓，得出总资产）。
            </div>
          )}
        </div>
      </div>
    </>
  );
}
