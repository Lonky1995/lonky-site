import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Lonky 的博客 — 关于产品思维、AI 工具、加密货币和 Web 开发的思考与实践。",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
