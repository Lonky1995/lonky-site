"use client";

import type { Project } from "@/data/projects";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";

export function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const { locale, dict } = useLocale();
  const output = project.latestOutput;

  return (
    <AnimatedCard delay={index * 0.1}>
      {/* Category + status badges */}
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

      <p className="mb-4 text-sm leading-relaxed text-muted">
        {project.description[locale]}
      </p>

      {/* Latest output preview */}
      {output && (
        <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-accent">
              {output.title || dict.projects.latestOutput}
            </span>
            <span className="text-[10px] text-muted">{output.date}</span>
          </div>

          {output.summary && (
            <div className="mb-3 text-[13px] leading-relaxed text-foreground/90">
              {output.summary.split("\n\n").map((paragraph, i) => (
                <p key={i} className={i > 0 ? "mt-2" : ""}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {output.items.length > 0 && (
            <ul
              className={`space-y-2 ${output.summary ? "border-t border-border/30 pt-3" : ""}`}
            >
              {output.items.map((item) => (
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
          )}
        </div>
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
