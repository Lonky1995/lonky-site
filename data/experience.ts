export type Experience = {
  period: string;
  title: string;
  company?: string;
  description: string;
  tags: string[];
};

export const experiences: Experience[] = [
  {
    period: "2024 - Present",
    title: "Independent Builder / Vibecoder",
    description:
      "Building AI-powered tools and crypto platforms. 18 projects, 1193 Obsidian notes, and counting. Combining product thinking with hands-on coding using AI assistants.",
    tags: ["AI", "Crypto", "Claude Code", "Next.js", "Python"],
  },
  {
    period: "2019 - 2024",
    title: "Senior Product Manager",
    description:
      "5 years of product management across consumer and B2B products. Led feature development, user research, and data-driven decision making.",
    tags: ["Product Strategy", "User Research", "Data Analysis", "Agile"],
  },
  {
    period: "Ongoing",
    title: "Knowledge Builder",
    description:
      "Maintaining a 1193-article Obsidian knowledge base covering product management, technology, crypto markets, and AI development.",
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
