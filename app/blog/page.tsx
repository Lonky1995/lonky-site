"use client";

import { useState, useEffect } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilter } from "@/components/blog/BlogFilter";
import { Section } from "@/components/ui/Section";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [active, setActive] = useState("All");

  useEffect(() => {
    // Dynamic import velite data
    import("@/.velite")
      .then(({ posts: allPosts }) => {
        const published = allPosts
          .filter((p: { published: boolean }) => p.published)
          .sort(
            (a: { date: string }, b: { date: string }) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map(
            (p: {
              slug: string;
              title: string;
              description: string;
              date: string;
              category: string;
            }) => ({
              slug: p.slug,
              title: p.title,
              description: p.description || "",
              date: new Date(p.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              category: p.category || "Uncategorized",
            })
          );
        setPosts(published);
        const cats = [
          "All",
          ...new Set(published.map((p: BlogPost) => p.category)),
        ] as string[];
        setCategories(cats);
      })
      .catch(() => {
        // No posts yet
      });
  }, []);

  const filtered =
    active === "All" ? posts : posts.filter((p) => p.category === active);

  return (
    <Section
      title="Blog"
      subtitle="Thoughts on product management, AI, crypto, and building things."
    >
      <BlogFilter
        categories={categories}
        active={active}
        onSelect={setActive}
      />

      {filtered.length === 0 ? (
        <p className="text-muted">No posts yet. Coming soon...</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((post, i) => (
            <BlogCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      )}
    </Section>
  );
}
