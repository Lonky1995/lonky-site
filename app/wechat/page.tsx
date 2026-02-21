import { getLatestWechatArticle } from "@/lib/wechat";
import Link from "next/link";

export default async function WechatArticlePage() {
  const article = await getLatestWechatArticle();

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-2xl font-bold">文章未找到</h1>
        <Link href="/" className="text-accent hover:underline mt-4 inline-block">
          ← 返回首页
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      {/* Header */}
      <header className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-accent mb-4 inline-block">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold md:text-4xl mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>@{article.author}</span>
          <span>·</span>
          <span>{article.updated_at}</span>
        </div>
      </header>

      {/* Content */}
      <div className="prose prose-invert max-w-none">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{article.content}</p>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-border">
        <p className="text-sm text-muted mb-4">
          本文同步自微信公众号「{article.author}」
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.329 6.329 0 0 1-.235-1.69c0-3.65 3.387-6.611 7.565-6.611.324 0 .639.025.95.06C17.1 4.505 13.273 2.188 8.69 2.188z" />
          </svg>
          在微信中阅读原文
        </a>
      </footer>
    </article>
  );
}
