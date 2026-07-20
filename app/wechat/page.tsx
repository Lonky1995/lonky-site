import { getLatestWechatArticle } from "@/lib/wechat";
import Link from "next/link";

export default async function WechatArticlePage() {
  const article = await getLatestWechatArticle();

  if (!article) {
    return (
      <div className="apple-width pb-24 pt-16" style={{ maxWidth: 720 }}>
        <h1 className="apple-section-title">文章未找到</h1>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-white/70 hover:text-white">
          ← 返回首页
        </Link>
      </div>
    );
  }

  return (
    <article
      className="apple-width pb-24 pt-12"
      style={{ maxWidth: 720, width: "min(720px, calc(100vw - 48px))" }}
    >
      <header className="mb-8" data-reveal>
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-white/50 hover:text-white"
        >
          ← 返回首页
        </Link>
        <h1 className="apple-section-title" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>
          {article.title}
        </h1>
        <div className="apple-blog-meta mt-4">
          <span>@{article.author}</span>
          <span>{article.updated_at}</span>
        </div>
      </header>

      <div className="prose-custom prose-dark" data-reveal>
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{article.content}</p>
      </div>

      <footer className="mt-12 border-t border-white/10 pt-8">
        <p className="mb-4 text-sm text-white/50">
          本文同步自微信公众号「{article.author}」
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-button"
        >
          查看原文
        </a>
      </footer>
    </article>
  );
}
