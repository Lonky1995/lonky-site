"use client";

import Link from "next/link";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { PodcastCard } from "@/components/projects/PodcastCard";
import { TradeMirrorCard } from "@/components/projects/TradeMirrorCard";
import { TgDigestCard } from "@/components/projects/TgDigestCard";
import { Section } from "@/components/ui/Section";
import { useLocale } from "@/components/locale-provider";

function renderCard(project: (typeof projects)[number], index: number) {
  switch (project.id) {
    case "podcast-notes":
      return <PodcastCard key={project.id} project={project} index={index} />;
    case "trade-style-analyzer":
      return <TradeMirrorCard key={project.id} project={project} index={index} />;
    case "tg-channel-digest":
      return <TgDigestCard key={project.id} project={project} index={index} />;
    default:
      return <ProjectCard key={project.id} project={project} index={index} />;
  }
}

export function ProjectsPreview() {
  const { dict } = useLocale();
  const featured = projects.filter((p) => p.featured);

  return (
    <Section
      id="projects"
      title={dict.projects.homeTitle}
      subtitle={dict.projects.homeSubtitle}
    >
      <div className="grid gap-6 md:grid-cols-[2fr_1fr] items-start">
        {featured.map((project, i) => (
          <div key={project.id} className={i === 0 ? "md:row-span-2" : i === 2 ? "md:col-span-full" : ""}>
            {renderCard(project, i)}
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/projects"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          {dict.projects.viewAll}
        </Link>
      </div>
    </Section>
  );
}
