"use client";

import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
};

export function BlogPreview({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <Section
        id="blog"
        title="Latest Writing"
        subtitle="Thoughts on product, technology, and building things."
      >
        <p className="text-muted">Coming soon...</p>
      </Section>
    );
  }

  return (
    <Section
      id="blog"
      title="Latest Writing"
      subtitle="Thoughts on product, technology, and building things."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {posts.slice(0, 3).map((post, i) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <AnimatedCard delay={i * 0.1}>
              <span className="mb-2 inline-block text-xs text-accent">
                {post.category}
              </span>
              <h3 className="mb-2 text-lg font-semibold">{post.title}</h3>
              <p className="text-sm text-muted line-clamp-2">
                {post.description}
              </p>
              <p className="mt-3 text-xs text-muted">{post.date}</p>
            </AnimatedCard>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Read all posts →
        </Link>
      </div>
    </Section>
  );
}
