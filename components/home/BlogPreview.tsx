"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
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
  return post.type === "podcast" ? `/podcast-notes/${post.slug}` : `/blog/${post.slug}`;
}

export function BlogPreview({ posts }: { posts: BlogPost[] }) {
  const { dict } = useLocale();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? posts : posts.slice(0, 2);
  const hasMore = posts.length > 2;

  if (posts.length === 0) {
    return (
      <section className="px-6 py-20 md:px-8 border-t border-border/20">
        <div className="mx-auto max-w-6xl">
          <p className="text-muted">{dict.blog.noPosts}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-20 md:px-8 border-t border-border/20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="section-cmd mb-2">$ cat 想法/</div>
          <h2 className="section-title-lg">{dict.blog.title}</h2>
        </motion.div>

        {/* Featured first post */}
        {posts[0] && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4"
          >
            <Link href={getPostHref(posts[0])}>
              <div className="writing-featured-card">
                <div className="wc-meta">
                  <span className="wc-cat">{posts[0].category}</span>
                  <span className="wc-date">{posts[0].date}</span>
                </div>
                <div className="wc-title-featured">{posts[0].title}</div>
                <div className="wc-desc">{posts[0].description}</div>
                <span className="wc-arrow">↗</span>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Grid of remaining posts */}
        <div className="writing-grid-2col">
          <AnimatePresence initial={false}>
            {posts.slice(1).map((post, i) => {
              if (!expanded && i >= 2) return null;
              return (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={getPostHref(post)}>
                    <div className="writing-card">
                      <div className="wc-meta">
                        <span className="wc-cat">{post.category}</span>
                        <span className="wc-date">{post.date}</span>
                      </div>
                      <div className="wc-title">{post.title}</div>
                      <div className="wc-desc">{post.description}</div>
                      <span className="wc-arrow">↗</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center gap-6">
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="writing-expand-btn"
            >
              <span
                style={{
                  display: "inline-block",
                  transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ↓
              </span>
              {expanded ? "收起" : "展开更多"}
            </button>
          )}
          <Link href="/blog" className="text-sm text-muted transition-colors hover:text-foreground font-mono">
            {dict.blog.readAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
