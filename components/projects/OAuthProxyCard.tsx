"use client";

import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";
import { Detective, Lock, LockOpen } from "@phosphor-icons/react";

const painPoints = {
  zh: {
    heading: "你有 Claude Max 订阅，但只能在官方 CLI 里用？",
    points: [
      "OAuth Token 拿到了，直接调 API 却返回 401",
      "换成 Bearer 认证还是报错，文档里根本没写怎么用",
      "想让自己的 Agent / Bot 复用订阅额度，但找不到方法",
      "按量付费的 API Key 太贵，明明有订阅却用不上",
    ],
    solution:
      "逆向了 Claude Code 的 3 个隐藏认证要求，一个代理搞定，零依赖直接跑。",
  },
  en: {
    heading:
      "You have a Claude Max subscription, but can only use it in the official CLI?",
    points: [
      "Got the OAuth token, but direct API calls return 401",
      "Switched to Bearer auth — still errors, docs say nothing about it",
      "Want your own Agent/Bot to reuse subscription quota, but no way to do it",
      "Pay-per-use API keys are expensive when you already have a subscription",
    ],
    solution:
      "Reverse-engineered 3 hidden auth requirements from Claude Code. One proxy, zero dependencies, just works.",
  },
};

const flowSteps = {
  zh: [
    {
      icon: (
        <Detective
          size={16}
          weight="duotone"
          className="text-accent-light"
        />
      ),
      title: "逆向认证流程",
      desc: "发现 3 个未公开的必要条件：Beta 头、身份 System Prompt、浏览器访问头",
    },
    {
      icon: (
        <Lock size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "自动注入凭证",
      desc: "代理自动读取 OAuth Token，补全所有隐藏 Header 和请求体字段",
    },
    {
      icon: (
        <LockOpen
          size={16}
          weight="duotone"
          className="text-accent-light"
        />
      ),
      title: "透明代理",
      desc: "指向 localhost:8080 即可调用，兼容 OpenAI SDK / curl / 任意 HTTP 客户端",
    },
  ],
  en: [
    {
      icon: (
        <Detective
          size={16}
          weight="duotone"
          className="text-accent-light"
        />
      ),
      title: "Reverse-engineer Auth",
      desc: "Discovered 3 undocumented requirements: beta headers, identity system prompt, browser access header",
    },
    {
      icon: (
        <Lock size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "Auto-inject Credentials",
      desc: "Proxy reads OAuth token and injects all hidden headers and body fields automatically",
    },
    {
      icon: (
        <LockOpen
          size={16}
          weight="duotone"
          className="text-accent-light"
        />
      ),
      title: "Transparent Proxy",
      desc: "Point to localhost:8080 and call away — compatible with OpenAI SDK / curl / any HTTP client",
    },
  ],
};

const cta = {
  zh: "GitHub 查看",
  en: "View on GitHub",
};

export function OAuthProxyCard({
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
      <div className="mb-4 rounded-none border border-foreground/20 bg-background/50 p-4">
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

      {/* CTA */}
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-none border-2 border-foreground bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {cta[locale]}
        </a>
      )}
    </AnimatedCard>
  );
}
