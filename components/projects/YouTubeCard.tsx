"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

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

function formatViews(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
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
            每周更新
          </span>
        )}
      </div>

      <h3 className="mb-2 text-xl font-bold">{project.title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        {project.description}
      </p>

      {/* Live video list */}
      {items.length > 0 ? (
        <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-accent">
              最近精选视频
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
                    {item.channel} · {formatViews(item.views)} views
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
              更新于 {new Date(data.generated_at).toLocaleString("zh-CN")}
            </p>
          )}
        </div>
      ) : (
        /* Fallback: static data */
        project.latestOutput && (
          <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-accent">
                {project.latestOutput.title || "最近精选视频"}
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

      {/* Links */}
      <div className="flex gap-3">
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Live Demo →
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Source →
          </a>
        )}
      </div>
    </AnimatedCard>
  );
}
