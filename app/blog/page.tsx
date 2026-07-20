"use client";

import { useState, useEffect } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilter } from "@/components/blog/BlogFilter";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";

type ListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  type: "blog" | "podcast";
  coverImage?: string;
  platform?: string;
  duration?: number;
  externalUrl?: string;
};

export default function BlogPage() {
  const { locale, dict } = useLocale();
  const [items, setItems] = useState<ListItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [active, setActive] = useState("All");

  useEffect(() => {
    import("@/.velite")
      .then((mod) => {
        const blogItems: ListItem[] = (mod.posts || [])
          .filter((p: { published: boolean }) => p.published)
          .map(
            (p: {
              slug: string;
              title: string;
              description: string;
              date: string;
              category: string;
              coverImage?: string;
              externalUrl?: string;
            }) => ({
              slug: p.slug,
              title: p.title,
              description: p.description || "",
              date: p.date,
              category: p.category || "Uncategorized",
              type: "blog" as const,
              coverImage: p.coverImage,
              externalUrl: p.externalUrl,
            }),
          );

        const podcastItems: ListItem[] = (mod.podcastNotes || [])
          .filter((n: { published: boolean }) => n.published)
          .map(
            (n: {
              slug: string;
              title: string;
              description: string;
              date: string;
              category: string;
              coverImage?: string;
              platform?: string;
              duration?: number;
            }) => ({
              slug: n.slug,
              title: n.title,
              description: n.description || "",
              date: n.date,
              category: n.category || "播客笔记",
              type: "podcast" as const,
              coverImage: n.coverImage,
              platform: n.platform,
              duration: n.duration,
            }),
          );

        const all = [...blogItems, ...podcastItems]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((item) => ({
            ...item,
            date: new Date(item.date).toLocaleDateString(
              locale === "zh" ? "zh-CN" : "en-US",
              { year: "numeric", month: "short", day: "numeric" },
            ),
          }));

        setItems(all);
        setCategories(["All", ...new Set(all.map((item) => item.category))] as string[]);
      })
      .catch(() => {});
  }, [locale]);

  const filtered =
    active === "All" ? items : items.filter((item) => item.category === active);

  return (
    <PageShell className="pb-24">
      <PageHeader
        eyebrow="Notes"
        title={dict.blog.title}
        subtitle={dict.blog.subtitle}
        action={
          <Link href="/podcast-notes/new" className="primary-button">
            + 播客笔记
          </Link>
        }
      />

      <BlogFilter categories={categories} active={active} onSelect={setActive} />

      {filtered.length === 0 ? (
        <p className="apple-muted">{dict.blog.noPostsFiltered}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, i) => (
            <BlogCard key={`${item.type}-${item.slug}`} post={item} index={i} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
