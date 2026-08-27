"use client";

import { Fragment, useState } from "react";
import type { Top20Row } from "@/types/crypto-breadth";
import { fmtPct, fmtUsd, toneColor, toneOf } from "@/lib/crypto-breadth/format";

function ExpandedRow({ row }: { row: Top20Row }) {
  const combined = row.combined_momentum;
  const day = combined?.horizons?.find((h) => h.window === "1D");

  return (
    <tr>
      <td colSpan={6} style={{ padding: 0 }}>
        <div className="p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>Binance 24H成交额</div>
              <div className="font-mono text-sm text-white">{fmtUsd(row.binance_quote_volume_24h_usdt)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>OKX 24H成交额</div>
              <div className="font-mono text-sm text-white">{fmtUsd(row.okx_quote_volume_24h_usdt)}</div>
            </div>
            {day && (
              <>
                <div>
                  <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>1D 现货成交额变化</div>
                  <div className="font-mono text-sm" style={{ color: toneColor(toneOf(day.spot_change_pct)) }}>
                    {fmtPct(day.spot_change_pct, 1)}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>1D 合约成交额变化</div>
                  <div className="font-mono text-sm" style={{ color: toneColor(toneOf(day.futures_change_pct)) }}>
                    {fmtPct(day.futures_change_pct, 1)}
                  </div>
                </div>
              </>
            )}
            {day?.leader_label && (
              <div>
                <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>1D 领涨方</div>
                <div className="text-sm text-white">{day.leader_label}</div>
              </div>
            )}
            <div>
              <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>交易所覆盖</div>
              <div className="text-sm text-white">{row.exchange_coverage}</div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function Top20Table({ rows }: { rows: Top20Row[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!rows?.length) return null;

  return (
    <div className="pf-panel" data-reveal>
      <p className="pf-panel-title" style={{ margin: 0 }}>
        Top20 币种状态
      </p>
      <p className="mt-1 text-xs" style={{ color: "rgba(245,247,251,0.4)" }}>
        点击行展开现货 / 合约成交额明细
      </p>
      <div className="pf-table-wrap mt-3">
        <table className="pf-table">
          <thead>
            <tr>
              <th>#</th>
              <th>币种</th>
              <th>24H成交额</th>
              <th>24H涨跌</th>
              <th>1H涨跌</th>
              <th>1H超额BTC</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.symbol}>
                <tr
                  onClick={() => setExpanded(expanded === r.symbol ? null : r.symbol)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{r.rank}</td>
                  <td style={{ color: "#fff", fontWeight: 600 }}>{r.symbol}</td>
                  <td>{fmtUsd(r.quote_volume_24h_usdt)}</td>
                  <td style={{ color: toneColor(toneOf(r.change_24h_pct)) }}>{fmtPct(r.change_24h_pct, 2)}</td>
                  <td style={{ color: toneColor(toneOf(r.change_1h_pct)) }}>{fmtPct(r.change_1h_pct, 2)}</td>
                  <td style={{ color: toneColor(toneOf(r.excess_btc_1h_pct)) }}>
                    {fmtPct(r.excess_btc_1h_pct, 2)}
                  </td>
                </tr>
                {expanded === r.symbol && <ExpandedRow row={r} />}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
