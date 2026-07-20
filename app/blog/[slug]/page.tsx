import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
  externalUrl?: string;
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
  if (post.externalUrl) redirect(post.externalUrl);

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
    <article
      className="apple-width pb-24"
      style={{ maxWidth: 720, width: "min(720px, calc(100vw - 48px))" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pt-12 mb-10" data-reveal>
        <div className="apple-blog-meta mb-4">
          <span>{post.category}</span>
          <span>{date}</span>
        </div>
        <h1 className="apple-section-title" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>
          {post.title}
        </h1>
        {post.description && (
          <p className="apple-muted" style={{ marginTop: 16 }}>
            {post.description}
          </p>
        )}
      </div>

      <ImageZoom html={post.body} className="prose-custom prose-dark" />

      <div className="mt-16 border-t border-white/10 pt-8">
        <BackLink />
      </div>
    </article>
  );
}
