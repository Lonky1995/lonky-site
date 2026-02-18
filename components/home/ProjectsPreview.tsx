"use client";

import Link from "next/link";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { BriefingCard } from "@/components/projects/BriefingCard";
import { YouTubeCard } from "@/components/projects/YouTubeCard";
import { Section } from "@/components/ui/Section";

export function ProjectsPreview() {
  const featured = projects.filter((p) => p.featured).slice(0, 3);

  return (
    <Section
      id="projects"
      title="Featured Projects"
      subtitle="AI, crypto, and developer tools I've built."
    >
      <div className="space-y-6">
        {/* Crypto 市场简报 — 动态加载最新简报 */}
        {featured[0] && (
          <BriefingCard project={featured[0]} index={0} />
        )}
        {/* Remaining projects in 2-col grid */}
        {featured.length > 1 && (
          <div className="grid gap-6 md:grid-cols-2">
            {featured.slice(1).map((project, i) =>
              project.title === "YouTube AI 总结" ? (
                <YouTubeCard key={project.title} project={project} index={i + 1} />
              ) : (
                <ProjectCard key={project.title} project={project} index={i + 1} />
              )
            )}
          </div>
        )}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/projects"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          View all projects →
        </Link>
      </div>
    </Section>
  );
}
