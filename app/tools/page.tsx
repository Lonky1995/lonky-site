import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "工具",
  description: "自建的小工具集合：市场数据看板、交易分析器等。",
};

export default function ToolsPage() {
  return (
    <div className="apple-width pb-24 pt-10">
      <p className="apple-eyebrow">Tools</p>
      <h1 className="apple-section-title" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)" }}>
        工具
      </h1>
      <p className="apple-muted mt-3 max-w-2xl">自己在用的一些小工具，持续补充。</p>

      <div className="apple-card-grid mt-8">
        {tools.map((tool, i) => (
          <Link key={tool.id} href={tool.href} className="apple-card">
            <div className="apple-card-index">{String(i + 1).padStart(2, "0")}</div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <div className="apple-card-foot">
              <span>{tool.tags.join(" · ")}</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
