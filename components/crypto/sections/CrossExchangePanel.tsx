import type { CrossExchangeTop20, OkxInfo } from "@/types/crypto-breadth";

export default function CrossExchangePanel({
  crossExchange,
  okx,
}: {
  crossExchange: CrossExchangeTop20;
  okx: OkxInfo;
}) {
  if (!crossExchange?.available) return null;

  return (
    <div className="pf-panel" data-reveal>
      <p className="pf-panel-title" style={{ margin: 0 }}>
        跨交易所覆盖
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="pf-kpi">
          <div className="pf-kpi-label">Top20 双交易所覆盖</div>
          <div className="pf-kpi-value">{crossExchange.dual_exchange_count}/{crossExchange.symbol_count}</div>
        </div>
        <div className="pf-kpi">
          <div className="pf-kpi-label">主导驱动</div>
          <div className="pf-kpi-value">{crossExchange.driver_label}</div>
        </div>
        {okx?.available && (
          <>
            <div className="pf-kpi">
              <div className="pf-kpi-label">OKX 数据覆盖率</div>
              <div className="pf-kpi-value">{okx.coverage}%</div>
            </div>
            <div className="pf-kpi">
              <div className="pf-kpi-label">OKX 覆盖数量</div>
              <div className="pf-kpi-value">{okx.covered_count}/{okx.eligible_count}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
