"use client";

import { useState, useEffect } from "react";
import { PodcastCard } from "@/components/podcast/PodcastCard";
import { BlogFilter } from "@/components/blog/BlogFilter";
import { Section } from "@/components/ui/Section";
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
              new Date(b.date).getTime() - new Date(a.date).getTime()
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
                { year: "numeric", month: "short", day: "numeric" }
              ),
              category: n.category || "播客",
              platform: n.platform,
              coverImage: n.coverImage,
              duration: n.duration,
            })
          );
        setNotes(published);
        const cats = [
          "All",
          ...new Set(published.map((n: PodcastNote) => n.category)),
        ] as string[];
        setCategories(cats);
      })
      .catch(() => {});
  }, [locale]);

  const filtered =
    active === "All" ? notes : notes.filter((n) => n.category === active);

  return (
    <Section
      title={dict.podcast.title}
      subtitle={dict.podcast.subtitle || undefined}
    >
      <div className="mb-6 flex items-center justify-between">
        <BlogFilter
          categories={categories}
          active={active}
          onSelect={setActive}
        />
        <Link
          href="/podcast-notes/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + {dict.podcast.newNote}
        </Link>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">{dict.podcast.noNotes}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((note, i) => (
            <PodcastCard key={note.slug} note={note} index={i} />
          ))}
        </div>
      )}
    </Section>
  );
}
