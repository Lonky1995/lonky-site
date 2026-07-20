"use client";

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

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function PodcastCard({
  note,
  index = 0,
}: {
  note: PodcastNote;
  index?: number;
}) {
  const platform =
    note.platform === "xiaoyuzhou"
      ? "小宇宙"
      : note.platform === "apple"
        ? "Apple"
        : note.category;

  return (
    <Link
      href={`/podcast-notes/${note.slug}`}
      className="apple-blog-card"
      data-reveal
      style={{ ["--delay" as string]: `${index * 60}ms` }}
    >
      <div className="apple-blog-meta">
        <span>{platform}</span>
        <span>{note.date}</span>
        {note.duration ? <span>{formatDuration(note.duration)}</span> : null}
      </div>
      <div className="flex gap-4 items-start">
        {note.coverImage && (
          <img
            src={note.coverImage}
            alt=""
            className="h-14 w-14 flex-shrink-0 rounded-xl object-cover opacity-90"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3>{note.title}</h3>
          <p>{note.description}</p>
        </div>
      </div>
    </Link>
  );
}
