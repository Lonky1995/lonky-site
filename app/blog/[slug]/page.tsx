import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "./back-link";
import { ImageZoom } from "@/components/ui/ImageZoom";
import { siteConfig } from "@/data/site-config";

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
    alternates: {
      canonical: `${siteConfig.url}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteConfig.url}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${siteConfig.url}/blog/${post.slug}`,
    author: {
      "@type": "Person",
      name: "Lonky",
      url: siteConfig.url,
    },
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-medium text-accent">
            {post.category}
          </span>
          <span className="text-sm text-muted">{date}</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">
          {post.title}
        </h1>
        {post.description && (
          <p className="text-lg text-muted">{post.description}</p>
        )}
      </div>

      {/* Content */}
      <ImageZoom html={post.body} className="prose-custom" />

      {/* Back */}
      <div className="mt-16 border-t border-border pt-8">
        <BackLink />
      </div>
    </article>
  );
}
