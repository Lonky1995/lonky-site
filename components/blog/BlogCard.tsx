"use client";

import Link from "next/link";

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
  externalUrl?: string;
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
  const isExternal = !!post.externalUrl;
  const href = isExternal
    ? post.externalUrl!
    : post.type === "podcast"
      ? `/podcast-notes/${post.slug}`
      : `/blog/${post.slug}`;

  const body = (
    <>
      <div className="apple-blog-meta">
        <span>{post.category}</span>
        <span>{post.date}</span>
        {post.duration ? <span>{formatDuration(post.duration)}</span> : null}
      </div>
      <div className="flex gap-4 items-start">
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt=""
            className="h-14 w-14 flex-shrink-0 rounded-xl object-cover opacity-90"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3>{post.title}</h3>
          <p>{post.description}</p>
        </div>
      </div>
    </>
  );

  const style = { ["--delay" as string]: `${index * 60}ms` };

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="apple-blog-card"
        data-reveal
        style={style}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className="apple-blog-card" data-reveal style={style}>
      {body}
    </Link>
  );
}
