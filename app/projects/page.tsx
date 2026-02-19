"use client";

import { useState } from "react";
import { projects, categories, type Category } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Section } from "@/components/ui/Section";
import { useLocale } from "@/components/locale-provider";

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </Section>
  );
}
