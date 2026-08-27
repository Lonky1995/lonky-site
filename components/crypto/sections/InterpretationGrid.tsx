import type { Interpretation } from "@/types/crypto-breadth";

export default function InterpretationGrid({ items }: { items: Interpretation[] }) {
  if (!items?.length) return null;

  return (
    <div data-reveal>
      <p className="pf-panel-title">核心结论</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.title} className="pf-panel">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold text-white">{it.title}</h3>
              <span className="pf-chip shrink-0">{it.conclusion}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,251,0.65)" }}>
              {it.evidence}
            </p>
            {it.change && (
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(245,247,251,0.4)" }}>
                局限：{it.change}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
