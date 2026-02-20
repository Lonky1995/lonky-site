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
    id: "crypto-briefing",
    title: {
      zh: "Crypto 市场简报",
      en: "Crypto Market Briefing",
    },
    description: {
      zh: "每日自动聚合链上数据、衍生品指标和新闻面，用 AI 生成结构化市场简报并推送。",
      en: "Daily automated aggregation of on-chain data, derivatives metrics and news, with AI-generated structured market briefings.",
    },
    category: "Crypto",
    techStack: ["Python", "DeepSeek", "CoinGlass", "Telegram Bot"],
    featured: true,
    status: "live",
    latestOutput: {
      date: "2026-02-18",
      title: "📊 午间市场简报",
      summary:
        "🔴 核心发现：极致的恐惧与平静的衍生品\n\n恐惧贪婪指数报 8（极度恐惧），但全市场 24h 爆仓仅 $1.925 亿，多空比 1.66:1，多头未出现恐慌性踩踏。BTC/ETH 资金费率几乎中性，现货层面有轻微买盘支撑。\n\n散户情绪已跌入冰窟，但杠杆市场的「聪明钱」并未跟随恐慌——典型的情绪驱动底部特征，反弹弹簧正在被压缩。",
      items: [
        {
          title: "⚡ BTC 期权 MaxPain $71K，短期承压",
          meta: "2/20 到期 Call $125.2 亿 vs Put $72.8 亿，大资金试图将 BTC 压制在 $71K 以下",
        },
        {
          title: "📰 Founders Fund 清仓 ETHZilla 股份",
          meta: "顶级风投从 ETH 基础设施撤出，即使反弹空间也可能受限",
        },
        {
          title: "💎 山寨币死水微澜，DeFi TVL +0.02%",
          meta: "无热点无波动，HYPE 高 OI（$6.71 亿）是潜在波动风险点",
        },
        {
          title: "🎯 策略：不宜恐慌杀跌",
          meta: "反弹若无衍生品持仓放量和费率转正，则为减仓机会而非追涨信号",
        },
      ],
    },
  },
  {
    id: "youtube-ai",
    title: {
      zh: "YouTube AI 热门视频总结",
      en: "YouTube AI Trending Summary",
    },
    description: {
      zh: "自动追踪近期 AI 热门视频，提取关键内容并生成结构化摘要。",
      en: "Automatically tracks trending AI videos, extracts key content and generates structured summaries.",
    },
    category: "AI",
    techStack: ["Python", "Whisper", "DeepSeek", "YouTube API"],
    featured: true,
    status: "live",
    latestOutput: {
      date: "2026-02-16",
      items: [
        {
          title:
            "OpenClaw: The Viral AI Agent — Lex Fridman Podcast #491",
          meta: "46.5万 views · Lex Fridman",
          url: "https://youtube.com/watch?v=YFjfBk8HI5o",
        },
        {
          title:
            "The $285 Billion Crash Wall Street Won't Explain Honestly",
          meta: "29.0万 views · Wall Street Insights",
          url: "https://youtube.com/watch?v=DGWtSzqCpog",
        },
        {
          title: "Claude Opus 4.6: The Biggest AI Jump I've Covered",
          meta: "27.9万 views · AI Reviewer",
          url: "https://youtube.com/watch?v=JKk77rzOL34",
        },
      ],
    },
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
  // {
  //   id: "alphify",
  //   title: { zh: "Alphify", en: "Alphify" },
  //   description: {
  //     zh: "AI 驱动的加密货币交易 Copilot，实时分析市场数据，辅助制定和执行交易策略。",
  //     en: "AI-powered crypto trading Copilot for real-time market analysis and strategy execution.",
  //   },
  //   category: "AI",
  //   techStack: ["Next.js", "TypeScript", "LangChain", "OpenAI", "Firebase"],
  //   featured: true,
  //   status: "in-progress",
  // },
];

export const categories = ["Tool"] as const;
export type Category = (typeof categories)[number];
