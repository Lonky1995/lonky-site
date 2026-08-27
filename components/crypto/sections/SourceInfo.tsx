import type { ThresholdPolicy, UniverseInfo } from "@/types/crypto-breadth";

export default function SourceInfo({
  policy,
  universe,
}: {
  policy: ThresholdPolicy;
  universe: UniverseInfo;
}) {
  return (
    <div className="pf-panel" data-reveal>
      <p className="pf-panel-title" style={{ margin: 0 }}>
        数据来源与规则
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>覆盖范围</div>
          <p className="mt-1 text-sm" style={{ color: "rgba(245,247,251,0.75)" }}>
            {universe?.source}，{universe?.rule}，共 {universe?.active_count} 个活跃币种（
            {universe?.dual_exchange_count} 个双交易所覆盖）
          </p>
        </div>
        <div>
          <div className="text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>阈值策略</div>
          <p className="mt-1 text-sm" style={{ color: "rgba(245,247,251,0.75)" }}>
            版本 {policy?.version} · {policy?.review_cadence === "monthly_manual" ? "月度人工复核，期间冻结" : policy?.review_cadence}
          </p>
        </div>
      </div>
    </div>
  );
}
