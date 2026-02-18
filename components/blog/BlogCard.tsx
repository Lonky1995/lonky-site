"use client";

import Link from "next/link";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
};

export function BlogCard({
  post,
  index = 0,
}: {
  post: BlogPost;
  index?: number;
}) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <AnimatedCard delay={index * 0.05}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-medium text-accent">
                {post.category}
              </span>
              <span className="text-xs text-muted">{post.date}</span>
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
