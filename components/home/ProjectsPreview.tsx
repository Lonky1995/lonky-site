"use client";

import { useState } from "react";
import { projects } from "@/data/projects";
import { useLocale } from "@/components/locale-provider";

export function ProjectsPreview() {
  const { dict, locale } = useLocale();
  const featured = projects.filter((p) => p.featured);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? featured : featured.slice(0, 3);

  return (
    <section className="apple-width apple-section" id="projects">
      <div className="apple-section-head" data-reveal>
        <p className="apple-eyebrow">{locale === "zh" ? "作品" : "Work"}</p>
        <h2 className="apple-section-title">{dict.projects.homeTitle}</h2>
        <p className="apple-muted">{dict.projects.homeSubtitle}</p>
      </div>

      <div className="apple-card-grid">
        {visible.map((project, i) => {
          const href = project.link ?? project.github ?? "/projects";
          const external = href.startsWith("http");
          return (
            <a
              key={project.id}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="apple-card"
              data-reveal
              style={{ ["--delay" as string]: `${i * 100}ms` }}
            >
              <span className="apple-card-index">0{i + 1}</span>
              <h3>{project.title[locale]}</h3>
              <p>{project.description[locale]}</p>
              <div className="apple-card-foot">
                <span>{project.techStack.slice(0, 3).join(" · ")}</span>
                <span>{project.category}</span>
              </div>
            </a>
          );
        })}
      </div>

      {featured.length > 3 && (
        <button type="button" className="apple-expand-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? (locale === "zh" ? "收起" : "Show less") : locale === "zh" ? "展开更多" : "Show more"}
        </button>
      )}
    </section>
  );
}
