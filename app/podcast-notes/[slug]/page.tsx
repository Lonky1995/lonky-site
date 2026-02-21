import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ImageZoom } from "@/components/ui/ImageZoom";
import { ContinueChat } from "@/components/podcast/ContinueChat";
import { PodcastPlayer } from "@/components/podcast/PodcastPlayer";
import { TimestampContent } from "@/components/podcast/TimestampContent";

type PodcastNote = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  body: string;
  published: boolean;
  sourceUrl?: string;
  platform?: string;
  coverImage?: string;
  duration?: number;
  audioUrl?: string;
};

async function getNotes() {
  try {
    const mod = await import("@/.velite");
    return (mod.podcastNotes || []) as PodcastNote[];
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const notes = await getNotes();
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const notes = await getNotes();
  const note = notes.find((n) => n.slug === slug);
  if (!note) return {};
  return {
    title: note.title,
    description: note.description,
    openGraph: {
      title: note.title,
      description: note.description,
      ...(note.coverImage ? { images: [note.coverImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description: note.description,
      ...(note.coverImage ? { images: [note.coverImage] } : {}),
    },
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x26;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#x3C;/g, "<")
    .replace(/&lt;/g, "<")
    .replace(/&#x3E;/g, ">")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');
}

function slugify(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

type TocItem = { id: string; text: string; level: 2 | 3 };

function extractToc(html: string): TocItem[] {
  const toc: TocItem[] = [];
  // Extract h2 headings
  const h2Re = /<h2[^>]*>(.*?)<\/h2>/gi;
  let match;
  while ((match = h2Re.exec(html)) !== null) {
    const raw = match[1].replace(/<[^>]+>/g, "").trim();
    const text = decodeHtmlEntities(raw);
    if (text) toc.push({ id: slugify(text), text, level: 2 });
  }
  // Extract discussion questions: <p><strong>🙋 xxx</strong></p>
  const qRe = /<p><strong>🙋\s*(.*?)<\/strong><\/p>/gi;
  const discussionIdx = html.indexOf("和 AI 深入讨论") !== -1
    ? html.indexOf("和 AI 深入讨论")
    : html.indexOf("深入讨论");
  if (discussionIdx > -1) {
    const discussionHtml = html.substring(discussionIdx);
    while ((match = qRe.exec(discussionHtml)) !== null) {
      const raw = match[1].replace(/<[^>]+>/g, "").trim();
      const text = decodeHtmlEntities(raw);
      if (text) toc.push({ id: `q-${slugify(text)}`, text, level: 3 });
    }
  }
  return toc;
}

function injectHeadingIds(html: string, toc: TocItem[]): string {
  let h2Idx = 0;
  const h2Items = toc.filter((t) => t.level === 2);
  let result = html.replace(/<h2([^>]*)>/gi, (full, attrs) => {
    const item = h2Items[h2Idx++];
    if (!item) return full;
    if (/id=/.test(attrs)) return full;
    return `<h2${attrs} id="${item.id}">`;
  });
  // Wrap discussion Q&A blocks in chat-style cards
  const qItems = toc.filter((t) => t.level === 3);
  for (let i = 0; i < qItems.length; i++) {
    const q = qItems[i];
    const escaped = q.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`<p><strong>🙋\\s*${escaped}</strong></p>`, "i");
    const matchResult = result.match(re);
    if (!matchResult || matchResult.index === undefined) continue;
    const qStart = matchResult.index;
    // Find where the next Q starts (or end of content)
    let qEnd = result.length;
    if (i < qItems.length - 1) {
      const nextQ = qItems[i + 1];
      const nextEscaped = nextQ.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nextRe = new RegExp(`<p><strong>🙋\\s*${nextEscaped}</strong></p>`, "i");
      const nextMatch = result.substring(qStart + 1).match(nextRe);
      if (nextMatch && nextMatch.index !== undefined) {
        qEnd = qStart + 1 + nextMatch.index;
      }
    } else {
      // Last question: end before <details> or <hr> or end of discussion
      const detailsIdx = result.indexOf("<details>", qStart);
      const hrIdx = result.indexOf("<hr", qStart);
      if (detailsIdx > -1) qEnd = detailsIdx;
      else if (hrIdx > qStart) qEnd = hrIdx;
    }
    const questionHtml = matchResult[0];
    const answerHtml = result.substring(qStart + questionHtml.length, qEnd).trim();
    const card = `<div class="discussion-card" id="${q.id}">
<div class="discussion-q">${q.text}</div>
<div class="discussion-a">${answerHtml}</div>
</div>`;
    result = result.substring(0, qStart) + card + result.substring(qEnd);
  }
  return result;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default async function PodcastNoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const notes = await getNotes();
  const note = notes.find((n) => n.slug === slug);

  if (!note) notFound();

  const toc = extractToc(note.body);
  const bodyWithIds = injectHeadingIds(note.body, toc);

  const date = new Date(note.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const platformLabel =
    note.platform === "xiaoyuzhou"
      ? "小宇宙"
      : note.platform === "apple"
        ? "Apple Podcasts"
        : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-accent">
            {note.category}
          </span>
          <span className="text-sm text-muted">{date}</span>
          {platformLabel && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {platformLabel}
            </span>
          )}
          {note.duration && (
            <span className="text-sm text-muted">
              {formatDuration(note.duration)}
            </span>
          )}
        </div>

        <h1 className="mb-4 text-3xl font-bold md:text-4xl">
          {note.title}
        </h1>
        {note.sourceUrl && (
          <a
            href={note.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-accent hover:underline"
          >
            收听原节目 →
          </a>
        )}

        {note.tags && note.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Audio player — sticky, outside header so it sticks on scroll */}
      {note.audioUrl && <PodcastPlayer audioUrl={note.audioUrl} />}

      {/* TOC */}
      {toc.length > 0 && (
        <nav className="mb-10 rounded-lg border border-border bg-card/50 p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">目录</p>
          <ul className="space-y-1.5">
            {toc.map((item) => (
              <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                <a
                  href={`#${item.id}`}
                  className={`transition-colors hover:text-accent ${
                    item.level === 3
                      ? "text-xs text-muted/70"
                      : "text-sm text-muted"
                  }`}
                >
                  {item.level === 3 ? `💬 ${item.text}` : item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Content */}
      {note.audioUrl ? (
        <TimestampContent html={bodyWithIds} className="prose-custom" />
      ) : (
        <ImageZoom html={bodyWithIds} className="prose-custom" />
      )}

      {/* Continue chatting */}
      <ContinueChat
        title={note.title}
        description={note.description}
        bodyText={note.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
        keyTopics={note.tags}
        slug={slug}
      />

      {/* Back */}
      <div className="mt-16 border-t border-border pt-8">
        <Link
          href="/podcast-notes"
          className="text-sm text-accent hover:underline"
        >
          ← 返回全部播客笔记
        </Link>
      </div>
    </article>
  );
}
