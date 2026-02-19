"use client";

import { experiences, skills } from "@/data/experience";
import { Timeline } from "@/components/about/Timeline";
import { Section } from "@/components/ui/Section";
import { TechBadge } from "@/components/ui/TechBadge";
import { useLocale } from "@/components/locale-provider";

function AboutIntro() {
  const { locale } = useLocale();

  if (locale === "zh") {
    return (
      <div className="max-w-2xl">
        <p className="mb-4 text-lg leading-relaxed text-muted">
          我是一名用 AI 学会编程的产品经理。在为他人打造产品 5
          年后，我开始构建自己的作品——将产品思维与实际开发结合。
        </p>
        <p className="mb-4 text-lg leading-relaxed text-muted">
          我的工具箱包括{" "}
          <span className="text-foreground">Claude Code</span>、
          <span className="text-foreground">Next.js</span> 和{" "}
          <span className="text-foreground">Python</span>
          。专注于 AI 应用、加密货币交易工具和效率系统。
        </p>
        <p className="text-lg leading-relaxed text-muted">
          我维护着一个拥有{" "}
          <span className="text-foreground">1,193 篇笔记</span>
          的 Obsidian 知识库——我的第二大脑，记录产品洞察、技术学习和市场研究。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-lg leading-relaxed text-muted">
        I&apos;m a product manager who learned to code with AI. After 5
        years of building products for others, I started building my own —
        combining product thinking with hands-on development.
      </p>
      <p className="mb-4 text-lg leading-relaxed text-muted">
        My toolkit includes{" "}
        <span className="text-foreground">Claude Code</span>,{" "}
        <span className="text-foreground">Next.js</span>, and{" "}
        <span className="text-foreground">Python</span>. I focus on AI
        applications, crypto trading tools, and productivity systems.
      </p>
      <p className="text-lg leading-relaxed text-muted">
        I maintain an Obsidian knowledge base with{" "}
        <span className="text-foreground">1,193 notes</span> — my second
        brain for product insights, technical learnings, and market
        research.
      </p>
    </div>
  );
}

export default function AboutPage() {
  const { dict } = useLocale();

  return (
    <>
      <Section title={dict.aboutPage.title}>
        <AboutIntro />
      </Section>

      <Section title={dict.aboutPage.experience}>
        <Timeline items={experiences} />
      </Section>

      <Section title={dict.aboutPage.skills}>
        <div className="flex flex-wrap gap-3">
          {skills.map((skill) => (
            <TechBadge key={skill} label={skill} />
          ))}
        </div>
      </Section>
    </>
  );
}
