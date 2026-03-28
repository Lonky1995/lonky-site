"use client";

import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";
import { Broadcast, Robot, Bell } from "@phosphor-icons/react";

const painPoints = {
  zh: {
    heading: "你关注了几十个 Telegram 频道，但每天真的看得过来吗？",
    points: [
      "频道太多，消息刷不完，重要信号淹没在噪音里",
      "KOL 凌晨发的观点，醒来已经找不到了",
      "手动整理频道信息太耗时，但不整理又怕漏掉机会",
      "想知道「交易圈今天在聊什么」，但没有汇总工具",
    ],
    solution: "这个工具 24 小时帮你盯盘，每 8 小时自动生成一份结构化摘要，推送到 Discord。",
  },
  en: {
    heading: "You follow dozens of Telegram channels. Can you actually keep up?",
    points: [
      "Too many channels — important signals buried in noise",
      "KOL posted alpha at 3am, gone by the time you wake up",
      "Manual curation is exhausting, but missing signals costs money",
      "You want to know 'what crypto Twitter is talking about' — but there's no digest",
    ],
    solution:
      "This tool monitors 24/7 and delivers a structured AI digest to your Discord every 8 hours.",
  },
};

const flowSteps = {
  zh: [
    { icon: <Broadcast size={16} weight="duotone" className="text-accent-light" />, title: "实时监听", desc: "Telethon 接入 53 个频道，消息实时写入 SQLite" },
    { icon: <Robot size={16} weight="duotone" className="text-accent-light" />, title: "AI 总结", desc: "每 8 小时拉取消息，Claude / GPT 生成交易信号+情绪摘要" },
    { icon: <Bell size={16} weight="duotone" className="text-accent-light" />, title: "Discord 推送", desc: "结构化摘要自动发到 Discord，醒来就能看" },
  ],
  en: [
    { icon: <Broadcast size={16} weight="duotone" className="text-accent-light" />, title: "Real-time Listener", desc: "Telethon monitors 53 channels, messages stored in SQLite" },
    { icon: <Robot size={16} weight="duotone" className="text-accent-light" />, title: "AI Digest", desc: "Every 8h, pull messages → Claude/GPT generates trading signals + sentiment" },
    { icon: <Bell size={16} weight="duotone" className="text-accent-light" />, title: "Discord Push", desc: "Structured digest auto-posted to Discord — ready when you wake up" },
  ],
};

const cta = {
  zh: "GitHub 查看",
  en: "View on GitHub",
};

export function TgDigestCard({
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
