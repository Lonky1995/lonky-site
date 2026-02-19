"use client";

import Link from "next/link";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { BriefingCard } from "@/components/projects/BriefingCard";
import { YouTubeCard } from "@/components/projects/YouTubeCard";
import { PodcastCard } from "@/components/projects/PodcastCard";
import { Section } from "@/components/ui/Section";
import { useLocale } from "@/components/locale-provider";

export function ProjectsPreview() {
  const { dict } = useLocale();
  const featured = projects.filter((p) => p.featured).slice(0, 3);

  return (
    <Section
      id="projects"
      title={dict.projects.homeTitle}
      subtitle={dict.projects.homeSubtitle}
    >
      <div className="space-y-6">
        {featured[0] && (
          <BriefingCard project={featured[0]} index={0} />
        )}
        {featured.length > 1 && (
          <div className={`grid gap-6 ${featured.length > 2 ? "md:grid-cols-2" : ""}`}>
            {featured.slice(1).map((project, i) =>
              project.id === "youtube-ai" ? (
                <YouTubeCard
                  key={project.id}
                  project={project}
                  index={i + 1}
                />
              ) : project.id === "podcast-notes" ? (
                <PodcastCard
                  key={project.id}
                  project={project}
                  index={i + 1}
                />
              ) : (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i + 1}
                />
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
          {dict.projects.viewAll}
        </Link>
      </div>
    </Section>
  );
}
