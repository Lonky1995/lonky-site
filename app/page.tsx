import { Suspense } from "react";
import { Tweet } from "react-tweet";
import { Hero } from "@/components/home/Hero";
import { AboutTimeline } from "@/components/home/AboutTimeline";
import { ProjectsPreview } from "@/components/home/ProjectsPreview";
import { BlogPreview } from "@/components/home/BlogPreview";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getLatestTweetId } from "@/lib/twitter";
import { getLatestWechatArticle } from "@/lib/wechat";

// Try to import blog posts + podcast notes from velite, fallback to empty
let blogPosts: { slug: string; title: string; description: string; date: string; category: string; type: string }[] = [];
try {
  const { posts, podcastNotes } = await import("@/.velite");

  const blogItems = (posts || [])
    .filter((p: { published: boolean }) => p.published)
    .map((p: { slug: string; title: string; description: string; date: string; category: string }) => ({
      slug: p.slug, title: p.title, description: p.description || "",
      date: p.date, category: p.category || "Uncategorized", type: "blog",
    }));

  const podcastItems = (podcastNotes || [])
    .filter((n: { published: boolean }) => n.published)
    .map((n: { slug: string; title: string; description: string; date: string; category: string }) => ({
      slug: n.slug, title: n.title, description: n.description || "",
      date: n.date, category: n.category || "播客笔记", type: "podcast",
    }));

  blogPosts = [...blogItems, ...podcastItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map((p) => ({
      ...p,
      date: new Date(p.date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      }),
    }));
} catch {
  // Velite not built yet, no posts
}

export default async function Home() {
  const tweetId = await getLatestTweetId();
  const wechatArticle = await getLatestWechatArticle();

  return (
    <>
      <Hero />
      <AboutTimeline />
      <ProjectsPreview />
      <BlogPreview posts={blogPosts} />
      <ContactCTA
        tweetSlot={
          <Suspense fallback={<div className="h-[200px] animate-pulse rounded-xl bg-card" />}>
            <Tweet id={tweetId} />
          </Suspense>
        }
        wechatArticle={wechatArticle ?? undefined}
      />
    </>
  );
}
