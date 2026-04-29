import type { L } from "@/i18n/config";

export type OutputItem = {
  title: string;
  meta: string;
  url?: string;
};

export type LatestOutput = {
  date: string;
  title?: string;
  summary?: string;
  items: OutputItem[];
};

export type Project = {
  id: string;
  title: L;
  description: L;
  longDescription?: string;
  category: "AI" | "Crypto" | "Tool";
  techStack: string[];
  image?: string;
  link?: string;
  github?: string;
  featured: boolean;
  status?: "in-progress" | "live";
  latestOutput?: LatestOutput;
  year?: string;
};

export const projects: Project[] = [
  {
    id: "lonkyclaw",
    title: {
      zh: "LonkyClaw",
      en: "LonkyClaw",
    },
    description: {
      zh: "我的个人 Agent 系统：Trading Agent 自动分析加密市场，生活助理 Agent 处理日常琐事。",
      en: "My personal agent system: a Trading Agent for crypto market analysis and a Life Assistant Agent for daily tasks.",
    },
    category: "AI",
    techStack: ["TypeScript", "Python", "Claude", "Docker"],
    github: "https://github.com/Lonky1995/lonkyclaw",
    featured: true,
    status: "in-progress",
    year: "2025",
  },
  {
    id: "podcast-notes",
    title: {
      zh: "播客笔记工具",
      en: "Podcast Notes Tool",
    },
    description: {
      zh: "贴一个播客链接，自动转录 → AI 生成结构化笔记 → 和 AI 深入讨论 → 一键生成播客笔记。",
      en: "Paste a podcast URL, auto-transcribe → AI-generated structured notes → deep discussion → one-click generate podcast notes.",
    },
    category: "AI",
    techStack: ["Next.js", "AssemblyAI", "DeepSeek", "Vercel AI SDK"],
    link: "/podcast-notes",
    featured: true,
    status: "live",
    year: "2025",
  },
  {
    id: "claude-oauth-proxy",
    title: {
      zh: "Claude OAuth Proxy",
      en: "Claude OAuth Proxy",
    },
    description: {
      zh: "逆向 Claude Code 的 OAuth 认证流程，让你用 Max/Pro 订阅额度直接调用 Messages API。纯 Python 标准库，零依赖。",
      en: "Reverse-engineered Claude Code's OAuth auth flow. Use your Max/Pro subscription quota to call the Messages API directly. Pure Python stdlib, zero dependencies.",
    },
    category: "Tool",
    techStack: ["Python", "Reverse Engineering", "OAuth", "HTTP Proxy"],
    github: "https://github.com/Lonky1995/claude-oauth-proxy",
    featured: true,
    status: "live",
    year: "2025",
  },
  {
    id: "tg-channel-digest",
    title: {
      zh: "TG 频道摘要",
      en: "TG Channel Digest",
    },
    description: {
      zh: "实时监控 53 个 Telegram 加密货币频道，每 8 小时用 AI 生成交易信号、市场情绪和 KOL 观点的结构化摘要。",
      en: "Monitors 53 Telegram crypto channels in real-time, generates AI-powered trading signal and market sentiment digests every 8 hours.",
    },
    category: "Crypto",
    techStack: ["Python", "Telethon", "Claude", "SQLite", "Discord"],
    github: "https://github.com/Lonky1995/tg-channel-digest",
    featured: true,
    status: "live",
    year: "2024",
  },
  {
    id: "family-menu",
    title: {
      zh: "家庭菜谱",
      en: "Family Menu",
    },
    description: {
      zh: "为老婆做的每日菜谱生成器。AI 从 266 道家常菜中随机搭配大人菜谱，再为 1 岁半宝宝改造出软烂无盐版本。支持一键分享为菜谱图片、本地保存历史。",
      en: "A daily menu generator I built for my wife. AI picks adult meals from 266 home recipes, then adapts baby-safe versions for our 1.5-year-old twins. One-click share as recipe image, saves history locally.",
    },
    category: "AI",
    techStack: ["Next.js", "DeepSeek", "HowToCook", "html-to-image"],
    link: "/menu",
    featured: true,
    status: "live",
    year: "2025",
  },
];

export const categories = ["Tool"] as const;
export type Category = (typeof categories)[number];
