"use client";

import Link from "next/link";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

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
  return (
    <Link href={`/podcast-notes/${note.slug}`}>
      <AnimatedCard delay={index * 0.05}>
        <div className="flex items-start gap-4">
          {note.coverImage && (
            <img
              src={note.coverImage}
              alt={note.title}
              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-medium text-accent">
                {note.platform === "xiaoyuzhou" ? "小宇宙" : note.platform === "apple" ? "Apple" : note.category}
              </span>
              <span className="text-xs text-muted">{note.date}</span>
              {note.duration && (
                <span className="text-xs text-muted">
                  {formatDuration(note.duration)}
                </span>
              )}
            </div>
            <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-accent">
              {note.title}
            </h3>
            <p className="text-sm text-muted line-clamp-2">
              {note.description}
            </p>
          </div>
        </div>
      </AnimatedCard>
    </Link>
  );
}
