"use client";
import { projects } from "@/data/projects";
import { groupProjects, homeProjectIds } from "@/data/project-groups";
import { renderProjectCard } from "@/components/projects/renderProjectCard";
import { useLocale } from "@/components/locale-provider";

export default function ProjectsPage() {
  const { locale } = useLocale();
  const english = locale === "en";
  const groups = groupProjects(projects.filter(project => homeProjectIds.includes(project.id)));
  return <div className="mf-directory">
    <header className="mf-directory-heading"><h1>{english ? "Things I've built." : "把问题，做成工具。"}</h1><p>{english ? "Agents, research, and small everyday tools. Organized by what they do." : "从真实问题出发，构建 AI 工作流和研究工具。"}</p></header>
    <nav className="mf-directory-filter" aria-label={english ? "Project groups" : "作品分类"}>{groups.map((group) => <a key={group.id} href={`#${group.id}`}>{group[locale]} <span>{group.projects.length}</span></a>)}</nav>
    {groups.map((group) => <section className="mf-project-group" id={group.id} key={group.id}>
      <div className="mf-group-heading"><h2>{group[locale]}</h2><p>{group.description[locale]}</p></div>
      <div>{group.projects.map((project, i) => <details className="mf-project-detail" key={project.id}>
        <summary><span className="mf-work-index">0{i + 1}</span><div><h3>{project.title[locale]}</h3><p>{project.description[locale]}</p><span className="mf-project-status">{project.year} / {project.status === "live" ? (english ? "Available" : "已上线") : (english ? "In progress" : "构建中")}</span></div><span className="mf-detail-plus" aria-hidden>+</span></summary>
        <div className="mf-project-expanded">{renderProjectCard(project, 0)}</div>
      </details>)}</div>
    </section>)}
  </div>;
}
