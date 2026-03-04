import { siteConfig } from "@/data/site-config";

export async function GET() {
  const { posts = [], podcastNotes = [] } = await import("@/.velite");

  const publishedPosts = posts.filter(
    (p: { published: boolean }) => p.published
  ) as Array<{ slug: string; title: string; description: string }>;

  const publishedNotes = podcastNotes.filter(
    (n: { published: boolean }) => n.published
  ) as Array<{ slug: string; title: string; description: string }>;

  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `Website: ${siteConfig.url}`,
    "",
  ];

  if (publishedPosts.length > 0) {
    lines.push("## Blog Posts", "");
    for (const post of publishedPosts) {
      const desc = post.description ? `: ${post.description}` : "";
      lines.push(
        `- [${post.title}](${siteConfig.url}/blog/${post.slug})${desc}`
      );
    }
    lines.push("");
  }

  if (publishedNotes.length > 0) {
    lines.push("## Podcast Notes", "");
    for (const note of publishedNotes) {
      const desc = note.description ? `: ${note.description}` : "";
      lines.push(
        `- [${note.title}](${siteConfig.url}/podcast-notes/${note.slug})${desc}`
      );
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
