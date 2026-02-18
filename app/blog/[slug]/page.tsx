import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Try to get posts, with fallback
async function getPosts() {
  try {
    const { posts } = await import("@/.velite");
    return posts;
  } catch {
    return [];
  }
}

type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  body: string;
  published: boolean;
};

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post: Post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const posts = await getPosts();
  const post = posts.find((p: Post) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getPosts();
  const post = posts.find((p: Post) => p.slug === slug);

  if (!post) notFound();

  const date = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-medium text-accent">
            {post.category}
          </span>
          <span className="text-sm text-muted">{date}</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">{post.title}</h1>
        {post.description && (
          <p className="text-lg text-muted">{post.description}</p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />

      {/* Back */}
      <div className="mt-16 border-t border-border pt-8">
        <a
          href="/blog"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Back to all posts
        </a>
      </div>
    </article>
  );
}
