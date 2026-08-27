import type { Confirmations, Derivatives } from "@/types/crypto-breadth";
import { fmtPct, toneColor } from "@/lib/crypto-breadth/format";

const SIGNAL_LABEL: Record<keyof Confirmations, string> = {
  capital: "资金",
  leverage: "杠杆",
  positioning: "仓位",
  driver: "驱动",
};

function toneOfSignal(tone: string): "gain" | "loss" | "neutral" {
  if (tone === "positive") return "gain";
  if (tone === "negative") return "loss";
  return "neutral";
}

export default function DerivativesConfirm({
  derivatives,
  confirmations,
}: {
  derivatives: Derivatives;
  confirmations: Confirmations;
}) {
  return (
    <div className="flex flex-col gap-4" data-reveal>
      <div>
        <p className="pf-panel-title">资金与杠杆确认信号</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(SIGNAL_LABEL) as (keyof Confirmations)[]).map((key) => {
            const sig = confirmations?.[key];
            if (!sig) return null;
            const tone = toneOfSignal(sig.tone);
            return (
              <div
                key={key}
                className="rounded-xl p-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderLeft: `3px solid ${toneColor(tone)}`,
                }}
              >
                <div className="text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
                  {SIGNAL_LABEL[key]}
                </div>
                <div className="mt-1 font-semibold" style={{ color: toneColor(tone) }}>
                  {sig.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {derivatives?.available && (
        <div className="pf-panel">
          <p className="pf-panel-title" style={{ margin: 0 }}>
            衍生品市场（{derivatives.primary_window ?? "3D"} 窗口）
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="pf-kpi">
              <div className="pf-kpi-label">资金费率中位数</div>
              <div className="pf-kpi-value">{fmtPct(derivatives.funding_median_pct, 4)}</div>
            </div>
            <div className="pf-kpi">
              <div className="pf-kpi-label">极端资金费率占比</div>
              <div className="pf-kpi-value">{fmtPct(derivatives.funding_extreme_share, 1)}</div>
            </div>
            <div className="pf-kpi">
              <div className="pf-kpi-label">1H 持仓量变化中位数</div>
              <div className="pf-kpi-value">{fmtPct(derivatives.oi_change_1h_median, 2)}</div>
            </div>
            <div className="pf-kpi">
              <div className="pf-kpi-label">24H 持仓量变化中位数</div>
              <div className="pf-kpi-value">{fmtPct(derivatives.oi_change_24h_median, 2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
