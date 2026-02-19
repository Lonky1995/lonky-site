import { Suspense } from "react";
import { Tweet } from "react-tweet";
import { Hero } from "@/components/home/Hero";
import { AboutTimeline } from "@/components/home/AboutTimeline";
import { ProjectsPreview } from "@/components/home/ProjectsPreview";
import { BlogPreview } from "@/components/home/BlogPreview";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getLatestTweetId } from "@/lib/twitter";

// Try to import blog posts from velite, fallback to empty
let blogPosts: { slug: string; title: string; description: string; date: string; category: string }[] = [];
try {
  const { posts } = await import("@/.velite");
  blogPosts = posts
    .filter((p: { published: boolean }) => p.published)
    .sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map((p: { slug: string; title: string; description: string; date: string; category: string }) => ({
      slug: p.slug,
      title: p.title,
      description: p.description || "",
      date: new Date(p.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      category: p.category || "Uncategorized",
    }));
} catch {
  // Velite not built yet, no posts
}

export default async function Home() {
  const tweetId = await getLatestTweetId();

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
      />
    </>
  );
}
