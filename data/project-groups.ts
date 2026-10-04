import type { Project } from "./projects";

// Editorial grouping is separate from the source catalog and project status.
export const projectGroups = [
  {
    id: "agents",
    zh: "AI 与工作流",
    en: "AI & workflows",
    description: {
      zh: "把信息处理和重复工作，交给自己构建的工具。",
      en: "Tools that turn information and repeated work into useful workflows.",
    },
    ids: [
      "clayyard",
      "lonkyclaw",
      "xhs-kit",
      "podcast-notes",
      "claude-oauth-proxy",
    ],
  },
  {
    id: "markets",
    zh: "市场与研究",
    en: "Markets & research",
    description: {
      zh: "把市场观察、研究过程和交易复盘放在一起。",
      en: "Market observations, research, and trading reviews in one place.",
    },
    ids: ["market-monitor", "trading-analyzer", "tg-channel-digest"],
  },
  {
    id: "everyday",
    zh: "日常小工具",
    en: "Everyday tools",
    description: {
      zh: "从真实生活里的小问题开始。",
      en: "Starting with small problems from everyday life.",
    },
    ids: ["family-menu"],
  },
];
export const homeProjectIds = [
  "clayyard",
  "lonkyclaw",
  "xhs-kit",
  "podcast-notes",
];
export function groupProjects(items: Project[]) {
  const assigned = new Set(projectGroups.flatMap((g) => g.ids));
  const groups = projectGroups
    .map((g) => ({
      ...g,
      projects: g.ids
        .map((id) => items.find((p) => p.id === id))
        .filter((p): p is Project => !!p),
    }))
    .filter((g) => g.projects.length);
  const other = items.filter((p) => !assigned.has(p.id));
  if (other.length)
    groups.push({
      id: "other",
      zh: "更多实验",
      en: "More experiments",
      description: {
        zh: "持续构建中的其他项目。",
        en: "Other ongoing experiments.",
      },
      ids: other.map((p) => p.id),
      projects: other,
    });
  return groups;
}
