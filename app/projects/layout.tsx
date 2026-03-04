import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Lonky 的项目集 — AI 驱动的工具、加密货币平台和各种有趣的实验。",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
