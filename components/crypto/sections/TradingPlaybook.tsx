import type { CryptoBreadthPayload, IntervalMetrics, IntervalKey } from "@/types/crypto-breadth";

type Tone = "gain" | "loss" | "neutral" | "warning";

type Playbook = {
  regime: string;
  tone: Tone;
  riskBudget: string;
  posture: string;
  allowed: string;
  avoid: string;
  trigger: string;
  invalidation: string;
};

const intervalLabel: Record<IntervalKey, string> = {
  "15m": "15 分钟",
  "1h": "1 小时",
  "4h": "4 小时",
};

function isRiskOff(code?: string) {
  return /(risk-off|weak|negative|selloff)/i.test(code ?? "");
}

function isConstructive(code?: string) {
  return /(risk-on|strong|positive|alt-rotation|broad-strength)/i.test(code ?? "");
}

function fmtPct(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(0)}%`;
}

export function buildPlaybook(data: CryptoBreadthPayload): Playbook {
  const states = data.states ?? {};
  const metrics = data.intervals ?? ({} as Record<IntervalKey, IntervalMetrics>);
  const h4 = states["4h"];
  const h1 = states["1h"];
  const h1Metrics = metrics["1h"];

  if (isRiskOff(h4?.code)) {
    return {
      regime: "防守模式",
      tone: "loss",
      riskBudget: "0–15% 常规风险",
      posture: "4H 风险环境偏弱，优先保护本金。",
      allowed: "只保留已验证的空头或 BTC 对冲；不新开山寨多单。",
      avoid: "不要把 15 分钟反弹当作趋势反转。",
      trigger: `只有 1H 上涨占比回到 50% 以上且跑赢 BTC 占比持续改善，才降级为观望。`,
      invalidation: "4H 风险状态解除前，所有反弹都视为低胜率交易。",
    };
  }

  if (isConstructive(h4?.code) && isConstructive(h1?.code)) {
    return {
      regime: "顺势扩张",
      tone: "gain",
      riskBudget: "50–75% 常规风险",
      posture: "4H 与 1H 同向，允许在回踩确认后逐步加仓。",
      allowed: "优先交易同时跑赢 BTC、成交额确认且 1H 结构未破坏的领涨币。",
      avoid: "不追第一根加速 K 线；等回踩后相对强度保持。",
      trigger: `1H 跑赢 BTC 占比保持 ${fmtPct(h1Metrics?.beat_btc)} 附近或继续上升，且 15 分钟回踩后恢复强势。`,
      invalidation: "15 分钟转弱并传导至 1H，或 1H 跑赢 BTC 占比连续收缩。",
    };
  }

  return {
    regime: "轻仓试错",
    tone: "warning",
    riskBudget: "15–30% 常规风险",
    posture: `${intervalLabel["4h"]}${h4?.label ?? "结构未明"}；短线信号不可直接放大为波段仓位。`,
    allowed: "只做少数 1H 相对 BTC 强、流动性充足的候选；分批而非一次性建仓。",
    avoid: "不做全市场山寨 beta，不追涨幅榜的尾段加速。",
    trigger: `1H 上涨占比由 ${fmtPct(h1Metrics?.positive)} 改善，并且跑赢 BTC 占比突破 50% 后，再提高风险预算。`,
    invalidation: "15 分钟强势未能传导到 1H，或 1H 下跌压力继续升高时撤销试错仓位。",
  };
}

const toneStyle: Record<Tone, { color: string; border: string }> = {
  gain: { color: "var(--gain)", border: "rgba(48,209,88,0.38)" },
  loss: { color: "var(--loss)", border: "rgba(255,69,58,0.42)" },
  neutral: { color: "rgba(245,247,251,0.86)", border: "rgba(255,255,255,0.14)" },
  warning: { color: "#e5a800", border: "rgba(229,168,0,0.42)" },
};

export default function TradingPlaybook({ data }: { data: CryptoBreadthPayload }) {
  const playbook = buildPlaybook(data);
  const style = toneStyle[playbook.tone];

  return (
    <section data-reveal aria-labelledby="trading-playbook-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="pf-panel-title" style={{ margin: 0 }}>今日交易剧本</p>
          <p className="mt-1 text-sm" style={{ color: "rgba(245,247,251,0.55)" }}>
            用 4H 定风险、1H 定方向、15 分钟只做执行确认。
          </p>
        </div>
        <span
          id="trading-playbook-heading"
          className="pf-chip"
          style={{ color: style.color, borderColor: style.border, background: "rgba(255,255,255,0.035)" }}
        >
          {playbook.regime}
        </span>
      </div>

      <div className="border-y border-white/10 py-4 sm:grid sm:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] sm:gap-8">
        <div className="border-b border-white/10 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-8">
          <div className="pf-kpi-label">总风险预算</div>
          <div className="mt-1 font-semibold" style={{ fontSize: "clamp(1.45rem, 3vw, 2.1rem)", color: style.color }}>
            {playbook.riskBudget}
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(245,247,251,0.72)" }}>
            {playbook.posture}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:mt-0 sm:grid-cols-2">
          <Rule label="允许的交易" value={playbook.allowed} />
          <Rule label="避免的交易" value={playbook.avoid} />
          <Rule label="提高风险预算" value={playbook.trigger} />
          <Rule label="撤销条件" value={playbook.invalidation} />
        </div>
      </div>
    </section>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "rgba(245,247,251,0.43)" }}>{label}</div>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgba(245,247,251,0.82)" }}>{value}</p>
    </div>
  );
}
