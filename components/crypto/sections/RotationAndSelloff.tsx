import type { RotationContext, SelloffProfile } from "@/types/crypto-breadth";
import { fmtPct, fmtUsd, toneOf } from "@/lib/crypto-breadth/format";

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" | "neutral" }) {
  return (
    <div className="pf-kpi">
      <div className="pf-kpi-label">{label}</div>
      <div className={`pf-kpi-value ${tone === "gain" ? "gain" : tone === "loss" ? "loss" : ""}`}>
        {value}
      </div>
    </div>
  );
}

export default function RotationAndSelloff({
  rotation,
  selloff,
}: {
  rotation: RotationContext;
  selloff: SelloffProfile;
}) {
  return (
    <div className="flex flex-col gap-4" data-reveal>
      {rotation?.available && (
        <div>
          <p className="pf-panel-title">板块轮动</p>
          <div className="pf-panel mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold text-white">{rotation.headline}</h3>
              <span className="pf-chip">{rotation.daily_label ?? rotation.short_term_label}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi
                label="BTC 占比 (BTC.D)"
                value={fmtPct(rotation.btc_dominance_pct, 2)}
                tone={toneOf(rotation.btc_dominance_change_24h_pp_est)}
              />
              <Kpi
                label="ETH/BTC 24H"
                value={fmtPct(
                  rotation.eth_btc_horizons?.find((h) => h.window === "1D")?.change_pct,
                  2
                )}
                tone={toneOf(rotation.eth_btc_horizons?.find((h) => h.window === "1D")?.change_pct)}
              />
              <Kpi
                label="TOTAL3/BTC 24H"
                value={fmtPct(rotation.total3_btc_change_24h_pct_est, 2)}
                tone={toneOf(rotation.total3_btc_change_24h_pct_est)}
              />
              <Kpi
                label="总市值 24H"
                value={fmtPct(rotation.total_market_cap_change_24h_pct, 2)}
                tone={toneOf(rotation.total_market_cap_change_24h_pct)}
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(245,247,251,0.6)" }}>
              {rotation.summary}
            </p>
          </div>
        </div>
      )}

      {selloff?.available && (
        <div>
          <p className="pf-panel-title">谁在承压</p>
          <div className="pf-panel mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold text-white">{selloff.headline}</h3>
              <span className="pf-chip">
                {selloff.matched_count}/{selloff.universe_count}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,251,0.6)" }}>
              {selloff.summary}
            </p>

            {selloff.cap_ranges && selloff.cap_ranges.length > 0 && (
              <div className="pf-table-wrap mt-4">
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>分组</th>
                      <th>数量</th>
                      <th>市值中位数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selloff.cap_ranges.map((r) => (
                      <tr key={r.group}>
                        <td style={{ color: "#fff" }}>{r.group}</td>
                        <td>{r.count}</td>
                        <td>{fmtUsd(r.median_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
