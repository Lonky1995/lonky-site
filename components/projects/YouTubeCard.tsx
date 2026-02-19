"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";

type YouTubeItem = {
  id: string;
  title: string;
  channel: string;
  views: number;
  summary: string;
  url: string;
};

type YouTubeData = {
  date: string;
  count: number;
  items: YouTubeItem[];
  generated_at: string;
};

function formatViews(n: number, locale: string) {
  if (locale === "zh") {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function YouTubeCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const { locale, dict } = useLocale();
  const [data, setData] = useState<YouTubeData | null>(null);

  useEffect(() => {
    fetch("/data/latest-youtube.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  const items = data?.items ?? [];

  return (
    <AnimatedCard delay={index * 0.1}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-accent">
          {project.category}
        </span>
        {project.status === "live" && (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
            {dict.projects.weeklyUpdate}
          </span>
        )}
      </div>

      <h3 className="mb-2 text-xl font-bold">
        {project.title[locale]}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        {project.description[locale]}
      </p>

      {/* Live video list */}
      {items.length > 0 ? (
        <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-accent">
              {dict.projects.recentVideos}
            </span>
            {data && (
              <span className="text-[10px] text-muted">{data.date}</span>
            )}
          </div>

          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                    {item.title}
                  </span>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">
                    {item.channel} · {formatViews(item.views, locale)}{" "}
                    {dict.common.views}
                  </p>
                  {item.summary && (
                    <p className="mt-1 text-[11px] leading-snug text-muted/80">
                      {item.summary}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ul>

          {data && (
            <p className="mt-3 text-[10px] text-muted/60">
              {dict.projects.updatedAt}{" "}
              {new Date(data.generated_at).toLocaleString(
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
                {project.latestOutput.title ||
                  dict.projects.recentVideos}
              </span>
              <span className="text-[10px] text-muted">
                {project.latestOutput.date}
              </span>
            </div>
            <ul className="space-y-2">
              {project.latestOutput.items.map((item) => (
                <li key={item.title} className="text-sm">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">
                      {item.title}
                    </span>
                  )}
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

      {/* Links */}
      <div className="flex gap-3">
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            {dict.projects.liveDemo}
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            {dict.projects.source}
          </a>
        )}
      </div>
    </AnimatedCard>
  );
}
