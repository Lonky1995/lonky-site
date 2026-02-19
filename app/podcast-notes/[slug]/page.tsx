import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

type PodcastNote = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  body: string;
  published: boolean;
  sourceUrl?: string;
  platform?: string;
  coverImage?: string;
  duration?: number;
};

async function getNotes() {
  try {
    const mod = await import("@/.velite");
    return (mod.podcastNotes || []) as PodcastNote[];
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const notes = await getNotes();
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const notes = await getNotes();
  const note = notes.find((n) => n.slug === slug);
  if (!note) return {};
  return {
    title: note.title,
    description: note.description,
    openGraph: note.coverImage ? { images: [note.coverImage] } : undefined,
  };
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default async function PodcastNoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const notes = await getNotes();
  const note = notes.find((n) => n.slug === slug);

  if (!note) notFound();

  const date = new Date(note.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const platformLabel =
    note.platform === "xiaoyuzhou"
      ? "小宇宙"
      : note.platform === "apple"
        ? "Apple Podcasts"
        : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-accent">
            {note.category}
          </span>
          <span className="text-sm text-muted">{date}</span>
          {platformLabel && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {platformLabel}
            </span>
          )}
          {note.duration && (
            <span className="text-sm text-muted">
              {formatDuration(note.duration)}
            </span>
          )}
        </div>

        <h1 className="mb-4 text-3xl font-bold md:text-4xl">
          {note.title}
        </h1>
        {note.description && (
          <p className="text-lg text-muted">{note.description}</p>
        )}

        {note.sourceUrl && (
          <a
            href={note.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            收听原节目 →
          </a>
        )}

        {note.tags && note.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: note.body }}
      />

      {/* Back */}
      <div className="mt-16 border-t border-border pt-8">
        <Link
          href="/podcast-notes"
          className="text-sm text-accent hover:underline"
        >
          ← 返回全部播客笔记
        </Link>
      </div>
    </article>
  );
}
