"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { projects } from "@/data/projects";
import { useLocale } from "@/components/locale-provider";

const categoryColor: Record<string, string> = {
  AI: "var(--color-accent-light)",
  Crypto: "var(--color-accent)",
  Tool: "var(--color-muted)",
};

export function ProjectsPreview() {
  const { dict } = useLocale();
  const featured = projects.filter((p) => p.featured);

  return (
    <section className="px-6 py-20 md:px-8 border-t border-border/20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="section-cmd mb-2">$ ls 作品/</div>
          <h2 className="section-title-lg">{dict.projects.homeTitle}</h2>
        </motion.div>

        <div className="project-list">
          {featured.map((project, i) => {
            const href = project.link ?? project.github;
            const isExternal = href?.startsWith("http");
            return (
              <motion.a
                key={project.id}
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="project-row"
                style={{ textDecoration: "none" }}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="p-index">0{i + 1}</span>
                <div className="p-main">
                  <div className="p-name">{project.title.zh}</div>
                  <div className="p-tagline">{project.description.zh}</div>
                  <div className="p-tech">{project.techStack.join(" · ")}</div>
                </div>
                <div className="p-right">
                  <span
                    className="p-cat"
                    style={{ color: categoryColor[project.category] ?? "var(--color-muted)" }}
                  >
                    {project.category}
                  </span>
                  {href && <span className="p-arrow">↗</span>}
                </div>
              </motion.a>
            );
          })}
        </div>

        <div className="mt-8">
          <Link href="/projects" className="text-sm text-muted transition-colors hover:text-foreground font-mono">
            {dict.projects.viewAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
