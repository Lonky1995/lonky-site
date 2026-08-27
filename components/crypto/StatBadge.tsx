import { toneColor } from "@/lib/crypto-breadth/format";

type Tone = "gain" | "loss" | "neutral" | "positive" | "negative" | "warning";

const TONE_MAP: Record<Tone, "gain" | "loss" | "neutral"> = {
  gain: "gain",
  positive: "gain",
  loss: "loss",
  negative: "loss",
  warning: "neutral",
  neutral: "neutral",
};

export function TrendTag({ label, tone }: { label: string; tone: Tone }) {
  const resolved = TONE_MAP[tone] ?? "neutral";
  return (
    <span
      className="pf-chip"
      style={{ color: toneColor(resolved), borderColor: "rgba(255,255,255,0.14)" }}
    >
      {label}
    </span>
  );
}

export function GuideTooltip({
  id,
  title,
  source,
  how,
  current,
}: {
  id: string;
  title: string;
  source?: string;
  how?: string;
  current?: string;
}) {
  return (
    <div
      id={id}
      className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-64 rounded-xl p-3 text-xs leading-relaxed opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      style={{
        background: "rgba(9,11,17,0.96)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(245,247,251,0.85)",
      }}
    >
      <div className="mb-1 font-bold" style={{ color: "rgba(245,247,251,0.95)" }}>
        {title}
      </div>
      {source && (
        <div className="mb-1">
          <span style={{ color: "rgba(245,247,251,0.45)" }}>数据口径：</span>
          {source}
        </div>
      )}
      {how && (
        <div className={current ? "mb-1" : undefined}>
          <span style={{ color: "rgba(245,247,251,0.45)" }}>怎么看：</span>
          {how}
        </div>
      )}
      {current && (
        <div>
          <span style={{ color: "rgba(245,247,251,0.45)" }}>当前：</span>
          {current}
        </div>
      )}
    </div>
  );
}
