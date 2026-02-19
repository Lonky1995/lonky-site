"use client";

import Link from "next/link";
import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";

const flowSteps = {
  zh: [
    {
      icon: "🔗",
      title: "贴入链接",
      desc: "粘贴小宇宙或 Apple Podcasts 链接，支持任意单集",
    },
    {
      icon: "🎙️",
      title: "AI 转录",
      desc: "自动语音识别，生成带时间戳的完整文字稿",
    },
    {
      icon: "📝",
      title: "结构化笔记",
      desc: "AI 提炼核心观点、金句、行动建议，一目了然",
    },
    {
      icon: "💬",
      title: "深入讨论",
      desc: "基于播客内容与 AI 对话，追问细节，激发新思考",
    },
    {
      icon: "🚀",
      title: "一键生成",
      desc: "生成带讨论记录的播客笔记，随时回顾",
    },
  ],
  en: [
    {
      icon: "🔗",
      title: "Paste Link",
      desc: "Paste a podcast episode URL from Xiaoyuzhou or Apple Podcasts",
    },
    {
      icon: "🎙️",
      title: "AI Transcribe",
      desc: "Auto speech-to-text with timestamps for the full episode",
    },
    {
      icon: "📝",
      title: "Structured Notes",
      desc: "AI extracts key insights, quotes, and action items at a glance",
    },
    {
      icon: "💬",
      title: "Deep Discussion",
      desc: "Chat with AI about the content, ask follow-ups, spark new ideas",
    },
    {
      icon: "🚀",
      title: "Generate",
      desc: "One-click generate podcast notes with discussion, ready to revisit",
    },
  ],
};

const painPoints = {
  zh: {
    heading: "听了很多播客，但记住了多少？",
    points: [
      "2 小时的播客，真正有用的可能只有 20 分钟",
      "听完就忘，过两天想不起关键内容",
      "想做笔记但手动整理太费时间",
      "听的时候有很多想法，但总忘记继续深入思考",
    ],
    solution: "这个工具帮你把播客变成可搜索、可回顾的结构化知识。",
  },
  en: {
    heading: "You listen to podcasts. But how much do you retain?",
    points: [
      "A 2-hour podcast may only have 20 minutes of real value",
      "You forget key insights within days",
      "Manual note-taking is too time-consuming",
      "You have ideas while listening, but forget to think deeper later",
    ],
    solution:
      "This tool turns podcasts into searchable, structured knowledge you can revisit anytime.",
  },
};

export function PodcastCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const { locale, dict } = useLocale();
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
      <div className="mb-5 rounded-lg border border-border/50 bg-background/50 p-4">
        <p className="mb-2.5 text-sm font-semibold text-foreground">
          {pain.heading}
        </p>
        <ul className="mb-3 space-y-1.5">
          {pain.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-xs leading-relaxed text-muted">
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
      <div className="mb-5 space-y-3">
        {steps.map((step, i) => (
          <div key={step.title} className="flex items-start gap-3">
            {/* Step indicator */}
            <div className="relative flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm">
                {step.icon}
              </div>
              {i < steps.length - 1 && (
                <div className="mt-0.5 h-5 w-px bg-border/60" />
              )}
            </div>
            {/* Text */}
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
      <Link
        href="/podcast-notes/new"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        {dict.podcast.newNote}
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </Link>
    </AnimatedCard>
  );
}
