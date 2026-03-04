import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts = [], podcastNotes = [] } = await import("@/.velite");

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/projects`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/podcast-notes`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = posts
    .filter((p: { published: boolean }) => p.published)
    .map((post: { slug: string; date: string }) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const podcastPages: MetadataRoute.Sitemap = podcastNotes
    .filter((n: { published: boolean }) => n.published)
    .map((note: { slug: string; date: string }) => ({
      url: `${siteConfig.url}/podcast-notes/${note.slug}`,
      lastModified: new Date(note.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...blogPages, ...podcastPages];
}
