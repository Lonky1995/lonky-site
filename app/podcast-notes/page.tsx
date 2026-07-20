"use client";

import { useState, useEffect } from "react";
import { PodcastCard } from "@/components/podcast/PodcastCard";
import { BlogFilter } from "@/components/blog/BlogFilter";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";

type PodcastNote = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  platform?: string;
  coverImage?: string;
  duration?: number;
};

export default function PodcastNotesPage() {
  const { locale, dict } = useLocale();
  const [notes, setNotes] = useState<PodcastNote[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [active, setActive] = useState("All");

  useEffect(() => {
    import("@/.velite")
      .then((mod) => {
        const allNotes = mod.podcastNotes || [];
        const published = allNotes
          .filter((n: { published: boolean }) => n.published)
          .sort(
            (a: { date: string }, b: { date: string }) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .map(
            (n: {
              slug: string;
              title: string;
              description: string;
              date: string;
              category: string;
              platform?: string;
              coverImage?: string;
              duration?: number;
            }) => ({
              slug: n.slug,
              title: n.title,
              description: n.description || "",
              date: new Date(n.date).toLocaleDateString(
                locale === "zh" ? "zh-CN" : "en-US",
                { year: "numeric", month: "short", day: "numeric" },
              ),
              category: n.category || "播客",
              platform: n.platform,
              coverImage: n.coverImage,
              duration: n.duration,
            }),
          );
        setNotes(published);
        setCategories([
          "All",
          ...new Set(published.map((n: PodcastNote) => n.category)),
        ] as string[]);
      })
      .catch(() => {});
  }, [locale]);

  const filtered =
    active === "All" ? notes : notes.filter((n) => n.category === active);

  return (
    <PageShell className="pb-24">
      <PageHeader
        eyebrow="Podcast"
        title={dict.podcast.title}
        subtitle={dict.podcast.subtitle}
        action={
          <Link href="/podcast-notes/new" className="primary-button">
            + {dict.podcast.newNote}
          </Link>
        }
      />

      <BlogFilter categories={categories} active={active} onSelect={setActive} />

      {filtered.length === 0 ? (
        <p className="apple-muted">{dict.podcast.noNotes}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((note, i) => (
            <PodcastCard key={note.slug} note={note} index={i} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
