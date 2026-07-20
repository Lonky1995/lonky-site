"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { renderMarkdown } from "@/lib/podcast/render-markdown";

type Discussion = {
  id: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string;
  question: string;
  answer: string;
  createdAt: string;
  isCurrentUser: boolean;
};

type CurrentUser = {
  id: string;
  name: string;
  image: string | null;
};

type DiscussionResponse = {
  currentUser: CurrentUser;
  canPost: boolean;
  alreadyParticipated: boolean;
  discussions: Discussion[];
};

const ANSWER_MAX_H = 160; // px

function CollapsibleAnswer({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);

  // Measure after paint to get accurate scrollHeight
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    // Use rAF to ensure styles are applied
    requestAnimationFrame(() => {
      if (el.scrollHeight > ANSWER_MAX_H) {
        setNeedsCollapse(true);
      }
    });
  }, [html]);

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: !expanded && needsCollapse ? `${ANSWER_MAX_H}px` : undefined }}
      >
        <div
          ref={innerRef}
          className="prose-custom prose-sm max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {needsCollapse && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-accent hover:underline"
        >
          {expanded ? "收起 ↑" : "查看全部 ↓"}
        </button>
      )}
    </div>
  );
}

export function ContinueChat({
  title,
  description,
  bodyText,
  keyTopics,
  slug,
}: {
  title: string;
  description: string;
  bodyText: string;
  keyTopics: string[];
  slug: string;
}) {
  const signInTarget = process.env.NEXT_PUBLIC_PODCAST_SIGN_IN_URL || "/sign-in";
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [loginUrl, setLoginUrl] = useState(signInTarget);
  const [hasAsked, setHasAsked] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const systemPrompt = useMemo(() => {
    const truncated =
      bodyText.length > 8000 ? bodyText.slice(0, 8000) + "\n..." : bodyText;
    return `你是用户的播客讨论搭子。用户刚读完一篇播客笔记，想围绕里面的话题继续深聊。

播客：${title}
${description ? `简介：${description}` : ""}
${keyTopics.length > 0 ? `关键主题：${keyTopics.join("、")}` : ""}

以下是文章全文（包含 AI 总结和之前的深入讨论）：
${truncated}

你的讨论风格：
- 先正面回应用户的观点或问题，再从用户没想到的角度追问
- 敢于挑战：如果观点有漏洞或理解有偏差，直接指出并给出理由
- 连接更大的图景：把观点和现实世界的案例、趋势、反例联系起来
- 不局限于播客本身：可以从不同行业/领域引入类比，挑战核心假设
- 控制篇幅：每次聚焦一个核心点讲透，结尾用尖锐问题把球抛回用户
- 如有反向论证，用 > ⚡ **反向论证** 格式
- 使用中文`;
  }, [title, description, bodyText, keyTopics]);

  // Load current user + discussions
  useEffect(() => {
    fetch(`/api/podcast/discuss?slug=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (r.status === 401) {
          setAuthRequired(true);
          return;
        }
        const data = (await r.json()) as DiscussionResponse;
        if (Array.isArray(data.discussions)) {
          setAuthRequired(false);
          setCurrentUser(data.currentUser || null);
          setDiscussions(data.discussions);
          setHasAsked(Boolean(data.alreadyParticipated));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingAnswer, discussions]);

  // Esc to abort streaming
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
        setIsStreaming(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Build cross-site login URL with return target.
  useEffect(() => {
    try {
      const base =
        typeof window !== "undefined" ? window.location.origin : "https://lonky.me";
      const url = new URL(signInTarget, base);
      if (typeof window !== "undefined") {
        url.searchParams.set("redirect_url", window.location.href);
      }
      setLoginUrl(url.toString());
    } catch {
      setLoginUrl(signInTarget);
    }
  }, [signInTarget]);

  const saveDiscussion = useCallback(
    async (question: string, answer: string) => {
      setSaving(true);
      setSaveError("");
      try {
        const res = await fetch("/api/podcast/discuss/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, question, answer }),
        });
        if (res.status === 401) {
          setAuthRequired(true);
          return;
        }
        if (res.status === 409) {
          setHasAsked(true);
          setSaveError("你已在本文参与讨论");
          return;
        }
        if (res.ok) {
          const thread: Discussion = await res.json();
          setDiscussions((prev) => [...prev, thread]);
          setHasAsked(true);
        } else {
          const data = await res.json().catch(() => ({ error: "保存失败，请重试" }));
          setSaveError(data.error || "保存失败，请重试");
        }
      } catch {
        setSaveError("保存失败，请重试");
      } finally {
        setSaving(false);
        setStreamingAnswer("");
        setStreamingQuestion("");
      }
    },
    [slug]
  );

  async function sendMessage(userContent: string) {
    setSaveError("");
    setIsStreaming(true);
    setStreamingQuestion(userContent);
    setStreamingAnswer("");

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/podcast/discuss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userContent }],
          system: systemPrompt,
        }),
        signal: abortRef.current.signal,
      });

      if (res.status === 401) {
        setAuthRequired(true);
        setSaveError("请先登录后参与讨论");
        setStreamingAnswer("");
        setStreamingQuestion("");
        throw new Error("Unauthorized");
      }
      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamingAnswer(full);
      }

      // Streaming done — save to GitHub
      setIsStreaming(false);
      await saveDiscussion(userContent, full);
    } catch (e) {
      if ((e as Error).name !== "AbortError" && (e as Error).message !== "Unauthorized") {
        setStreamingAnswer("出错了，请重试");
      }
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming || saving) return;
    const text = input;
    setInput("");
    sendMessage(text);
  }

  const canAsk = !authRequired && !!currentUser && !hasAsked && !isStreaming && !saving && !streamingQuestion;

  return (
    <div className="mt-12 rounded-xl border border-border bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">公开讨论区</p>
          <p className="text-xs text-muted">
            登录后可读写，每位账号限提问一次
          </p>
        </div>
        {discussions.length > 0 && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
            {discussions.length} 条讨论
          </span>
        )}
      </div>

      {/* Discussion threads */}
      <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted">
            <span className="animate-pulse">加载讨论中...</span>
          </div>
        ) : discussions.length === 0 && !streamingQuestion ? (
          <div className="p-6 text-center text-sm text-muted">
            还没有讨论，成为第一个提问的人吧
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {discussions.map((d) => (
              <div key={d.id} className="flex flex-col gap-3">
                {/* Question bubble — right aligned */}
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-2 mb-1 mr-1">
                    <span className="text-xs text-muted">
                      {new Date(d.createdAt).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      🙋 {d.isCurrentUser ? "你" : d.displayName}
                    </span>
                  </div>
                  <div className="flex max-w-[85%] items-start gap-2 rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm text-white">
                    <img
                      src={d.avatarUrl}
                      alt={d.displayName}
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-white/40"
                    />
                    <div className="whitespace-pre-wrap">
                      {d.question}
                    </div>
                  </div>
                </div>
                {/* Answer bubble — left aligned */}
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold text-accent mb-1 ml-1">🤖 AI</span>
                  <div className="max-w-[95%] rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-3">
                    <CollapsibleAnswer html={renderMarkdown(d.answer)} />
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming in progress */}
            {streamingQuestion && (
              <div className="flex flex-col gap-3">
                {/* Question bubble */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-foreground mb-1 mr-1">
                    🙋 {currentUser?.name || "你"} · 刚刚
                  </span>
                  <div className="flex max-w-[85%] items-start gap-2 rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm text-white">
                    <img
                      src={currentUser?.image || "/images/avatar-default.svg"}
                      alt={currentUser?.name || "你"}
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-white/40"
                    />
                    <div className="whitespace-pre-wrap">
                      {streamingQuestion}
                    </div>
                  </div>
                </div>
                {/* Answer bubble */}
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold text-accent mb-1 ml-1">🤖 AI</span>
                  <div className="max-w-[95%] rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-3">
                    {streamingAnswer ? (
                      <div
                        className="prose-custom prose-sm max-w-none text-sm"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(streamingAnswer),
                        }}
                      />
                    ) : (
                      <span className="animate-pulse text-sm text-muted">
                        AI 正在思考...
                      </span>
                    )}
                    {saving && (
                      <p className="mt-2 text-xs text-muted animate-pulse">
                        保存中...
                      </p>
                    )}
                    {saveError && (
                      <p className="mt-2 text-xs text-red-400">
                        {saveError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      {!loading && (
        <div className="border-t border-border p-4">
          {saveError && !streamingQuestion && (
            <p className="mb-3 text-center text-xs text-red-400">{saveError}</p>
          )}
          {authRequired ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted">请先登录后参与讨论</p>
              <a
                href={loginUrl}
                className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                去登录
              </a>
            </div>
          ) : hasAsked && !streamingQuestion ? (
            <p className="text-center text-sm text-muted">
              ✓ 你已在本文参与讨论
            </p>
          ) : canAsk ? (
            <div className="space-y-3">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 72) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.altKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="输入你的问题（每人限一次）..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                  style={{ maxHeight: 72 }}
                  disabled={isStreaming || saving}
                />
                <button
                  type="submit"
                  disabled={isStreaming || saving || !input.trim()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  提问
                </button>
              </form>
              <p className="text-xs text-muted text-center">
                每位账号限提问一次，问答将公开显示
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
