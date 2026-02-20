"use client";

import { useState } from "react";
import { projects, categories, type Category } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { BriefingCard } from "@/components/projects/BriefingCard";
import { YouTubeCard } from "@/components/projects/YouTubeCard";
import { PodcastCard } from "@/components/projects/PodcastCard";
import { Section } from "@/components/ui/Section";
import { useLocale } from "@/components/locale-provider";

function renderProjectCard(project: (typeof projects)[number], index: number) {
  switch (project.id) {
    case "crypto-briefing":
      return <BriefingCard key={project.id} project={project} index={index} />;
    case "youtube-ai":
      return <YouTubeCard key={project.id} project={project} index={index} />;
    case "podcast-notes":
      return <PodcastCard key={project.id} project={project} index={index} />;
    default:
      return <ProjectCard key={project.id} project={project} index={index} />;
  }
}

export default function ProjectsPage() {
  const { dict } = useLocale();
  const [active, setActive] = useState<Category>("All");

  const filtered =
    active === "All"
      ? projects
      : projects.filter((p) => p.category === active);

  return (
    <Section
      title={dict.projects.pageTitle}
      subtitle={dict.projects.pageSubtitle}
    >
      {/* Filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full px-4 py-1.5 text-sm transition-all ${
              active === cat
                ? "bg-accent text-white"
                : "border border-border text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-6">
        {filtered.map((project, i) => renderProjectCard(project, i))}
      </div>
    </Section>
  );
}
