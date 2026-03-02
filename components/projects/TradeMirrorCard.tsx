"use client";

import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";

const flowSteps = {
  zh: [
    {
      icon: "🔗",
      title: "连接交易所",
      desc: "API Key 只读同步，支持 OKX / Binance / Hyperliquid",
    },
    {
      icon: "📊",
      title: "数据分析",
      desc: "自动计算胜率、盈利因子、持仓习惯等 20+ 指标",
    },
    {
      icon: "🧠",
      title: "AI 诊断",
      desc: "DeepSeek 从习惯、择时、纪律三维度深度复盘",
    },
    {
      icon: "📈",
      title: "可视化报告",
      desc: "雷达图、交易热力图、盈亏分布、K 线回放",
    },
  ],
  en: [
    {
      icon: "🔗",
      title: "Connect Exchange",
      desc: "Read-only API sync, supports OKX / Binance / Hyperliquid",
    },
    {
      icon: "📊",
      title: "Data Analysis",
      desc: "Auto-calculate win rate, profit factor, position habits & 20+ metrics",
    },
    {
      icon: "🧠",
      title: "AI Diagnosis",
      desc: "DeepSeek reviews habits, timing & discipline in depth",
    },
    {
      icon: "📈",
      title: "Visual Report",
      desc: "Radar chart, trade heatmap, P&L distribution, K-line replay",
    },
  ],
};

const painPoints = {
  zh: {
    heading: "你每天在交易，但真的了解自己的交易习惯吗？",
    points: [
      "反复犯同样的错误，却说不清问题在哪",
      "凭感觉交易，没有数据化的复盘习惯",
      "赚钱不知道为什么赚，亏钱不知道为什么亏",
      "看了很多策略分享，但不知道适不适合自己的风格",
    ],
    solution: "TradeMirror 用数据和 AI 帮你看清自己的交易风格，找到真正的问题。",
  },
  en: {
    heading: "You trade every day. But do you really know your trading habits?",
    points: [
      "Repeating the same mistakes without knowing why",
      "Trading on gut feeling with no data-driven review habit",
      "Don't know why you profit or why you lose",
      "Read tons of strategies but unsure which fits your style",
    ],
    solution:
      "TradeMirror uses data and AI to reveal your trading patterns and pinpoint real issues.",
  },
};

const cta = {
  zh: "开始诊断",
  en: "Start Diagnosis",
};

export function TradeMirrorCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const { locale } = useLocale();
  const pain = painPoints[locale];
  const steps = flowSteps[locale];

  return (
    <AnimatedCard delay={index * 0.1}>
      {/* Category + status */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-accent">
          {project.category}
        </span>
        {project.status === "live" && (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
            Live
          </span>
        )}
      </div>

      <h3 className="mb-2 text-xl font-bold">{project.title[locale]}</h3>

      {/* Pain points */}
      <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
        <p className="mb-2.5 text-sm font-semibold text-foreground">
          {pain.heading}
        </p>
        <ul className="mb-3 space-y-1.5">
          {pain.points.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2 text-xs leading-relaxed text-muted"
            >
              <span className="mt-0.5 text-accent/60">-</span>
              {p}
            </li>
          ))}
        </ul>
        <p className="text-xs font-medium leading-relaxed text-accent">
          {pain.solution}
        </p>
      </div>

      {/* Flow steps */}
      <div className="mb-4 space-y-3">
        {steps.map((step, i) => (
          <div key={step.title} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm">
                {step.icon}
              </div>
              {i < steps.length - 1 && (
                <div className="mt-0.5 h-5 w-px bg-border/60" />
              )}
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-foreground">
                {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA + GitHub */}
      <div className="flex items-center gap-3">
        <a
          href="https://trademirror.lonky.me"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {cta[locale]}
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </a>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            GitHub →
          </a>
        )}
      </div>
    </AnimatedCard>
  );
}
