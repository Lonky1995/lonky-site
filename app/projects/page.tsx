"use client";

import { projects } from "@/data/projects";
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

  return (
    <Section
      title={dict.projects.pageTitle}
      subtitle={dict.projects.pageSubtitle}
    >
      {/* Grid */}
      <div className="space-y-6">
        {projects.map((project, i) => renderProjectCard(project, i))}
      </div>
    </Section>
  );
}
