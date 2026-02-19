"use client";

import Link from "next/link";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  type?: "blog" | "podcast";
  coverImage?: string;
  platform?: string;
  duration?: number;
};

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function BlogCard({
  post,
  index = 0,
}: {
  post: BlogPost;
  index?: number;
}) {
  const href = post.type === "podcast"
    ? `/podcast-notes/${post.slug}`
    : `/blog/${post.slug}`;

  return (
    <Link href={href}>
      <AnimatedCard delay={index * 0.05}>
        <div className="flex items-start gap-4">
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-medium text-accent">
                {post.category}
              </span>
              <span className="text-xs text-muted">{post.date}</span>
              {post.duration && (
                <span className="text-xs text-muted">
                  {formatDuration(post.duration)}
                </span>
              )}
            </div>
            <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-accent">
              {post.title}
            </h3>
            <p className="text-sm text-muted line-clamp-2">
              {post.description}
            </p>
          </div>
        </div>
      </AnimatedCard>
    </Link>
  );
}
