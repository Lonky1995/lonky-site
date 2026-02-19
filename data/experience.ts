import type { L } from "@/i18n/config";

export type Experience = {
  period: L;
  title: L;
  company?: string;
  description: L;
  tags: string[];
};

export const experiences: Experience[] = [
  {
    period: { en: "2024 - Present", zh: "2024 - 至今" },
    title: {
      en: "Independent Builder / Vibecoder",
      zh: "独立开发者 / Vibecoder",
    },
    description: {
      en: "Building AI-powered tools and crypto platforms. 18 projects, 1193 Obsidian notes, and counting. Combining product thinking with hands-on coding using AI assistants.",
      zh: "构建 AI 驱动的工具和加密货币平台。18 个项目、1193 篇 Obsidian 笔记，持续更新中。将产品思维与 AI 辅助编程结合。",
    },
    tags: ["AI", "Crypto", "Claude Code", "Next.js", "Python"],
  },
  {
    period: { en: "2019 - 2024", zh: "2019 - 2024" },
    title: { en: "Senior Product Manager", zh: "高级产品经理" },
    description: {
      en: "5 years of product management across consumer and B2B products. Led feature development, user research, and data-driven decision making.",
      zh: "5 年产品管理经验，涵盖消费者和 B2B 产品。主导功能开发、用户调研和数据驱动决策。",
    },
    tags: [
      "Product Strategy",
      "User Research",
      "Data Analysis",
      "Agile",
    ],
  },
  {
    period: { en: "Ongoing", zh: "持续中" },
    title: { en: "Knowledge Builder", zh: "知识构建者" },
    description: {
      en: "Maintaining a 1193-article Obsidian knowledge base covering product management, technology, crypto markets, and AI development.",
      zh: "维护 1193 篇 Obsidian 知识库，涵盖产品管理、技术、加密市场和 AI 开发。",
    },
    tags: ["Obsidian", "PKM", "Writing", "Research"],
  },
];

export const skills = [
  "Product Management",
  "Next.js",
  "TypeScript",
  "Python",
  "AI/LLM",
  "Claude Code",
  "LangChain",
  "Crypto",
  "Trading Systems",
  "Docker",
  "Firebase",
  "Telegram Bots",
  "Data Analysis",
  "Obsidian PKM",
  "Vercel",
  "Git",
];
