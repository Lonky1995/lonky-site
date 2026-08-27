import type { CryptoBreadthPayload, IntervalKey } from "@/types/crypto-breadth";
import { toneColor } from "@/lib/crypto-breadth/format";

const INTERVAL_LABEL: Record<IntervalKey, string> = { "15m": "15分钟", "1h": "1小时", "4h": "4小时" };

function stateTone(code: string): "gain" | "loss" | "neutral" {
  const c = code.toLowerCase();
  if (c.includes("risk-off") || c.includes("weak") || c.includes("negative")) return "loss";
  if (c.includes("risk-on") || c.includes("strong") || c.includes("positive")) return "gain";
  return "neutral";
}

export default function MarketPulseHero({ data }: { data: CryptoBreadthPayload }) {
  const tone = stateTone(data.state?.code ?? "");

  return (
    <div className="pf-panel" data-reveal>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="pf-kpi-label">全市场状态</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span
              className="font-bold"
              style={{ fontSize: "2.2rem", lineHeight: 1, color: toneColor(tone) }}
            >
              {data.state?.label ?? "—"}
            </span>
            {typeof data.state?.confidence === "number" && (
              <span className="pf-chip">置信度 {data.state.confidence}</span>
            )}
          </div>
          {data.alert_stage?.description && (
            <p className="mt-2 max-w-xl text-sm" style={{ color: "rgba(245,247,251,0.6)" }}>
              {data.alert_stage.description}
            </p>
          )}
        </div>
        <div className="text-right text-xs" style={{ color: "rgba(245,247,251,0.45)" }}>
          数据更新于
          <div className="mt-0.5 font-mono text-sm" style={{ color: "rgba(245,247,251,0.75)" }}>
            {data.generated_at_bjt}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
        {(Object.keys(INTERVAL_LABEL) as IntervalKey[]).map((k) => {
          const s = data.states?.[k];
          if (!s) return null;
          const t = stateTone(s.code ?? "");
          return (
            <div key={k} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="text-xs" style={{ color: "rgba(245,247,251,0.5)" }}>
                {INTERVAL_LABEL[k]}
              </div>
              <div className="mt-1 font-semibold" style={{ color: toneColor(t) }}>
                {s.label ?? "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
