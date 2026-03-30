"use client";

import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";
import {
  LinkSimple,
  Broadcast,
  Brain,
  ChartBar,
} from "@phosphor-icons/react";

const useCases = {
  zh: {
    heading: "如果你每天在 X 上跟 AI / Crypto / 投资账号，但又不想被信息流拖着走？",
    points: [
      "做研究时，想持续追踪一批账号最近在说什么，而不是靠收藏和记忆回找",
      "做内容选题时，想知道推荐流里最近哪些观点、账号和话题开始冒头",
      "看到一条爆款推文时，想回看它为什么能跑出来，而不是只记住一个截图",
      "想把“我关注的人在说什么”变成自己的数据库，后面可以继续做摘要、日报和策略分析",
    ],
    solution:
      "X Kit 先帮你把关注网络和推荐流拉成结构化数据，再计算频道、内容和爆款信号，让你用固定看板替代无止境刷流。",
  },
  en: {
    heading:
      "You follow AI, crypto, and investing accounts on X — but don't want to live inside the timeline?",
    points: [
      "For research, you want to track what a set of accounts is saying without relying on bookmarks and memory",
      "For content ideation, you want to see which opinions, accounts, and topics are starting to emerge in your home timeline",
      "When a tweet breaks out, you want to understand why it outperformed instead of just saving a screenshot",
      "You want your follow graph to become your own database so you can build digests, reports, and strategy layers on top",
    ],
    solution:
      "X Kit turns your follow graph and recommendations into structured data first, then computes channel, content, and viral signals so a fixed dashboard can replace endless scrolling.",
  },
};

const flowSteps = {
  zh: [
    {
      icon: (
        <LinkSimple size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "同步关注列表",
      desc: "读取你的 X 关注关系，生成账号池，并建立推荐流数据源。",
    },
    {
      icon: (
        <Broadcast size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "抓取时间线",
      desc: "手动刷新推荐流，或批量抓取账号推文，把内容从 X 拉到本地工作台。",
    },
    {
      icon: (
        <Brain size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "沉淀成数据库",
      desc: "推文、作者、任务、快照和分析结果统一落到 SQLite，后续可复盘、可追溯。",
    },
    {
      icon: (
        <ChartBar size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "看信号而不是刷流",
      desc: "直接看频道排行、内容分布和爆款分，判断谁值得继续跟，什么内容值得研究。",
    },
  ],
  en: [
    {
      icon: (
        <LinkSimple size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "Sync Your Follow Graph",
      desc: "Import your X follows into an account pool and create a home timeline source.",
    },
    {
      icon: (
        <Broadcast size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "Ingest Timelines",
      desc: "Refresh recommendations or pull account timelines into your own workspace instead of reading inside X.",
    },
    {
      icon: (
        <Brain size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "Store as a Research Database",
      desc: "Tweets, authors, jobs, snapshots, and analysis outputs land in SQLite for replay and traceability.",
    },
    {
      icon: (
        <ChartBar size={16} weight="duotone" className="text-accent-light" />
      ),
      title: "Read Signals, Not Feeds",
      desc: "Use channel rankings, content distributions, and viral scores to decide what deserves attention.",
    },
  ],
};

const cta = {
  zh: "GitHub 查看",
  en: "View on GitHub",
};

export function XKitCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const { locale, dict } = useLocale();
  const pain = useCases[locale];
  const steps = flowSteps[locale];

  return (
    <AnimatedCard delay={index * 0.1}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-accent">
          {project.category}
        </span>
        {project.status === "in-progress" && (
          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
            {dict.projects.inProgress}
          </span>
        )}
      </div>

      <h3 className="mb-2 text-xl font-bold">{project.title[locale]}</h3>

      <div className="mb-4 rounded-none border border-foreground/20 bg-background/50 p-4">
        <p className="mb-2.5 text-sm font-semibold text-foreground">
          {pain.heading}
        </p>
        <ul className="mb-3 space-y-1.5">
          {pain.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-xs leading-relaxed text-muted"
            >
              <span className="mt-0.5 text-accent/60">-</span>
              {point}
            </li>
          ))}
        </ul>
        <p className="text-xs font-medium leading-relaxed text-accent">
          {pain.solution}
        </p>
      </div>

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
