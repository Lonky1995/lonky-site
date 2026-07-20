"use client";

import { projects } from "@/data/projects";
import { renderProjectCard } from "@/components/projects/renderProjectCard";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { useLocale } from "@/components/locale-provider";

export default function ProjectsPage() {
  const { dict } = useLocale();

  const grouped = projects.reduce<Record<string, typeof projects>>((acc, p) => {
    const year = p.year ?? "2025";
    if (!acc[year]) acc[year] = [];
    acc[year].push(p);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <PageShell className="pb-24">
      <PageHeader
        eyebrow="Work"
        title={dict.projects.pageTitle}
        subtitle={dict.projects.pageSubtitle}
      />

      <div className="space-y-14">
        {years.map((year) => (
          <div key={year} data-reveal>
            <p className="apple-eyebrow" style={{ marginBottom: 16 }}>
              {year}
            </p>
            <div className="space-y-5">
              {grouped[year].map((project, i) => renderProjectCard(project, i))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
