"use client";

import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useLocale } from "@/components/locale-provider";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  type?: string;
};

function getPostHref(post: BlogPost) {
  return post.type === "podcast"
    ? `/podcast-notes/${post.slug}`
    : `/blog/${post.slug}`;
}

export function BlogPreview({ posts }: { posts: BlogPost[] }) {
  const { dict } = useLocale();

  if (posts.length === 0) {
    return (
      <Section
        id="blog"
        title={dict.blog.title}
        subtitle={dict.blog.subtitle}
      >
        <p className="text-muted">{dict.blog.noPosts}</p>
      </Section>
    );
  }

  return (
    <Section
      id="blog"
      title={dict.blog.title}
      subtitle={dict.blog.subtitle}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {posts.slice(0, 3).map((post, i) => (
          <Link key={post.slug} href={getPostHref(post)} className="h-full">
            <AnimatedCard delay={i * 0.1} className="h-full">
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
          {dict.blog.readAll}
        </Link>
      </div>
    </Section>
  );
}
