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
};

export const projects: Project[] = [
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
  },
  {
    id: "trade-style-analyzer",
    title: {
      zh: "TradeMirror",
      en: "TradeMirror",
    },
    description: {
      zh: "连接交易所，AI 自动复盘你的每一笔交易。从习惯、择时、纪律三维度深度诊断，用数据告诉你为什么赚、为什么亏。",
      en: "Connect your exchange, AI reviews every trade. Deep diagnosis across habits, timing & discipline — data-driven insights on why you win or lose.",
    },
    category: "Crypto",
    techStack: ["Next.js", "DeepSeek", "CCXT", "SQLite", "Recharts"],
    link: "https://trademirror.lonky.me",
    github: "https://github.com/Lonky1995/trademirror",
    featured: true,
    status: "live",
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
  },
];

export const categories = ["Tool"] as const;
export type Category = (typeof categories)[number];
