"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";

type Briefing = {
  date: string;
  period: string;
  content: string;
  generated_at: string;
};

/** 从简报纯文本中提取各段落 */
function parseBriefing(content: string) {
  const titleMatch = content.match(/^(📊[^\n]+)/);
  const title = titleMatch?.[1] ?? "";

  const sectionRegex =
    /(?:^|\n)((?:🔴|⚡|📰|💎|🎯)[^\n]*)\n([\s\S]*?)(?=\n(?:🔴|⚡|📰|💎|🎯)|\n*$)/g;
  const sections: { heading: string; body: string }[] = [];
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      heading: match[1].trim(),
      body: match[2].trim(),
    });
  }

  return { title, sections };
}

export function BriefingCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const { locale, dict } = useLocale();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/data/latest-briefing.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setBriefing(data))
      .catch(() => {});
  }, []);

  const parsed = briefing ? parseBriefing(briefing.content) : null;
  const visibleSections = parsed
    ? expanded
      ? parsed.sections
      : parsed.sections.slice(0, 2)
    : [];
  const hasMore = parsed ? parsed.sections.length > 2 : false;

  return (
    <AnimatedCard delay={index * 0.1}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-accent">
          {project.category}
        </span>
        {project.status === "live" && (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
            {dict.projects.dailyUpdate}
          </span>
        )}
      </div>

      <h3 className="mb-2 text-xl font-bold">
        {project.title[locale]}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        {project.description[locale]}
      </p>

      {/* Live briefing content */}
      {parsed ? (
        <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-accent">
              {parsed.title}
            </span>
          </div>

          <div className="space-y-3">
            {visibleSections.map((section, i) => (
              <motion.div
                key={section.heading}
                initial={i >= 2 ? { opacity: 0, height: 0 } : false}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="mb-1 text-[13px] font-semibold text-foreground">
                  {section.heading}
                </h4>
                <p className="whitespace-pre-line text-[12px] leading-relaxed text-muted">
                  {expanded
                    ? section.body
                    : section.body.length > 200
                      ? section.body.slice(0, 200) + "…"
                      : section.body}
                </p>
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-xs font-medium text-accent transition-colors hover:text-accent-light"
            >
              {expanded
                ? dict.projects.collapse
                : dict.projects.expandAll.replace(
                    "{count}",
                    String(parsed.sections.length)
                  )}
            </button>
          )}

          {briefing && (
            <p className="mt-2 text-[10px] text-muted/60">
              {dict.projects.generatedAt}{" "}
              {new Date(briefing.generated_at).toLocaleString(
                locale === "zh" ? "zh-CN" : "en-US"
              )}
            </p>
          )}
        </div>
      ) : (
        /* Fallback: static data */
        project.latestOutput && (
          <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-accent">
                {project.latestOutput.title || dict.projects.latestOutput}
              </span>
              <span className="text-[10px] text-muted">
                {project.latestOutput.date}
              </span>
            </div>
            <ul className="space-y-2">
              {project.latestOutput.items.map((item) => (
                <li key={item.title} className="text-sm">
                  <span className="font-medium text-foreground">
                    {item.title}
                  </span>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">
                    {item.meta}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      {/* Subscribe CTA */}
      <a
        href="https://t.me/aggrenews_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
        {dict.projects.subscribeCTA}
        <span className="text-xs text-muted">@aggrenews_bot</span>
      </a>
    </AnimatedCard>
  );
}
