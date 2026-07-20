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
    <AnimatedCard delay={index * 0.08}>
      <div className="mb-3 flex items-center gap-2">
        <span className="pf-chip">{project.category}</span>
        {project.status === "in-progress" && (
          <span className="pf-chip">{dict.projects.inProgress}</span>
        )}
      </div>

      <h3 className="mb-2" style={{ margin: "0 0 10px", color: "#fff", fontSize: "1.25rem", fontWeight: 700 }}>
        {project.title[locale]}
      </h3>

      <p className="apple-muted" style={{ fontSize: "0.92rem", marginBottom: 16 }}>
        {project.description[locale]}
      </p>

      {output && (
        <div
          className="mb-4 rounded-[20px] p-4"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white/80">
              {output.title || dict.projects.latestOutput}
            </span>
            <span className="text-[10px] text-white/40">{output.date}</span>
          </div>
          {output.summary && (
            <p className="text-[13px] leading-relaxed text-white/70 line-clamp-4">
              {output.summary}
            </p>
          )}
          {output.items.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {output.items.slice(0, 3).map((item) => (
                <li key={item.title} className="text-sm">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white/90 hover:text-white"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="font-medium text-white/90">{item.title}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-auto">
        {project.link && (
          <a href={project.link} className="text-xs font-semibold text-white/70 hover:text-white">
            {dict.projects.liveDemo}
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white/70 hover:text-white"
          >
            {dict.projects.source}
          </a>
        )}
      </div>
    </AnimatedCard>
  );
}
