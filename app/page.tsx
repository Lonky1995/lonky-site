import { Hero } from "@/components/home/Hero";
import { ProjectsPreview } from "@/components/home/ProjectsPreview";
import { BlogPreview } from "@/components/home/BlogPreview";
import { ContactCTA } from "@/components/home/ContactCTA";

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

export default function Home() {
  return (
    <>
      <Hero />
      <ProjectsPreview />
      <BlogPreview posts={blogPosts} />
      <ContactCTA />
    </>
  );
}
