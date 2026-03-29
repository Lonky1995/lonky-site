"use client";

import { projects } from "@/data/projects";
import { renderProjectCard } from "@/components/projects/renderProjectCard";
import { Section } from "@/components/ui/Section";
import { useLocale } from "@/components/locale-provider";

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
