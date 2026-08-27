import type { Cohort } from "@/types/crypto-breadth";
import { fmtPct, toneColor, toneOf } from "@/lib/crypto-breadth/format";

export default function CohortTable({ cohorts }: { cohorts: Cohort[] }) {
  if (!cohorts?.length) return null;

  return (
    <div className="pf-panel" data-reveal>
      <p className="pf-panel-title" style={{ margin: 0 }}>
        分层表现
      </p>
      <div className="pf-table-wrap mt-3">
        <table className="pf-table">
          <thead>
            <tr>
              <th>分组</th>
              <th>数量</th>
              <th>1H 中位收益</th>
              <th>1H 上涨占比</th>
              <th>1H 跑赢 BTC</th>
              <th>24H 中位收益</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => {
              const h1 = c.horizons?.["1h"];
              return (
                <tr key={c.name}>
                  <td style={{ color: "#fff" }}>{c.name}</td>
                  <td>{c.count}</td>
                  <td style={{ color: toneColor(toneOf(h1?.median_return)) }}>
                    {fmtPct(h1?.median_return, 2)}
                  </td>
                  <td>{fmtPct(h1?.positive, 1)}</td>
                  <td>{fmtPct(h1?.beat_btc, 1)}</td>
                  <td style={{ color: toneColor(toneOf(c.median_return_24h)) }}>
                    {fmtPct(c.median_return_24h, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
