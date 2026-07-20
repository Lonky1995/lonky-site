"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  type?: string;
  externalUrl?: string;
};

function getPostHref(post: BlogPost) {
  if (post.externalUrl) return post.externalUrl;
  return post.type === "podcast" ? `/podcast-notes/${post.slug}` : `/blog/${post.slug}`;
}

export function BlogPreview({ posts }: { posts: BlogPost[] }) {
  const { dict, locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const list = expanded ? posts.slice(0, 6) : posts.slice(0, 3);
  const hasMore = posts.length > 3;

  if (posts.length === 0) {
    return (
      <section className="apple-width apple-section">
        <p className="apple-muted">{dict.blog.noPosts}</p>
      </section>
    );
  }

  return (
    <section className="apple-width apple-section" id="notes">
      <div className="apple-section-head" data-reveal>
        <p className="apple-eyebrow">{locale === "zh" ? "想法" : "Notes"}</p>
        <h2 className="apple-section-title">{dict.blog.title}</h2>
        <p className="apple-muted">{dict.blog.subtitle}</p>
      </div>

      <div className="apple-blog-grid">
        {list.map((post, i) => {
          const href = getPostHref(post);
          const style = { ["--delay" as string]: `${i * 80}ms` };
          const body = (
            <>
              <div className="apple-blog-meta">
                <span>{post.category}</span>
                <span>{post.date}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
            </>
          );

          if (post.externalUrl) {
            return (
              <a
                key={post.slug}
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
            <Link
              key={post.slug}
              href={href}
              className="apple-blog-card"
              data-reveal
              style={style}
            >
              {body}
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <button type="button" className="apple-expand-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded
            ? locale === "zh"
              ? "收起"
              : "Show less"
            : locale === "zh"
              ? "展开更多"
              : "Show more"}
        </button>
      )}
    </section>
  );
}
