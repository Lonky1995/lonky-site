"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChatPanel } from "./ChatPanel";
import {
  buildSummarySystemPrompt,
  buildChatSystemPrompt,
} from "@/lib/podcast/prompts";
import { generateMarkdown, generateSlug, generateObsidianMarkdown } from "@/lib/podcast/markdown";
import { renderMarkdown } from "@/lib/podcast/render-markdown";

type PodcastMeta = {
  title: string;
  description: string;
  coverImage: string;
  audioUrl: string;
  platform: string;
  duration?: number;
};

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<Step, string> = {
  1: "输入链接",
  2: "确认信息",
  3: "转录中",
  4: "AI 笔记",
  5: "发布",
};

const STORAGE_KEY = "podcast_creator_state";

type SavedState = {
  step: Step;
  url: string;
  meta: PodcastMeta | null;
  transcriptId: string;
  transcript: string;
  summary: string;
  editTitle: string;
  editSlug: string;
  editTags: string;
  chatHistory: { id: string; role: string; content: string }[];
  savedAt: number;
};

function saveState(state: SavedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SavedState;
    // Expire after 7 days
    if (Date.now() - state.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function PodcastCreator() {
  const [step, setStep] = useState<Step>(1);
  const [secret, setSecret] = useState("");
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<PodcastMeta | null>(null);
  const [transcriptId, setTranscriptId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string>("queued");
  const [transcribeElapsed, setTranscribeElapsed] = useState(0);
  const [chatHistory, setChatHistory] = useState<{ id: string; role: string; content: string }[]>([]);

  // Step 5 editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editTags, setEditTags] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("podcast_secret");
    if (saved) setSecret(saved);

    const state = loadState();
    if (state) {
      setStep(state.step);
      setUrl(state.url);
      setMeta(state.meta);
      setTranscriptId(state.transcriptId);
      setTranscript(state.transcript);
      setSummary(state.summary);
      setEditTitle(state.editTitle);
      setEditSlug(state.editSlug);
      setEditTags(state.editTags);
      setChatHistory(state.chatHistory || []);
      setRestored(true);
    }
  }, []);

  // Persist state on every meaningful change
  useEffect(() => {
    if (step >= 2) {
      saveState({
        step,
        url,
        meta,
        transcriptId,
        transcript,
        summary,
        editTitle,
        editSlug,
        editTags,
        chatHistory,
        savedAt: Date.now(),
      });
    }
  }, [step, url, meta, transcriptId, transcript, summary, editTitle, editSlug, editTags, chatHistory]);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }),
    [secret]
  );

  // Step 1: Parse URL
  async function handleParse() {
    setError("");
    setLoading(true);
    try {
      sessionStorage.setItem("podcast_secret", secret);
      const res = await fetch("/api/podcast/parse", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMeta(data);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Start transcription
  async function handleTranscribe() {
    if (!meta) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/podcast/transcribe", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ audioUrl: meta.audioUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTranscriptId(data.transcriptId);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交转录失败");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Poll transcription status
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== 3 || !transcriptId) return;

    setTranscribeElapsed(0);
    setTranscribeStatus("queued");

    // Elapsed timer (every second)
    timerRef.current = setInterval(() => {
      setTranscribeElapsed((prev) => prev + 1);
    }, 1000);

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/podcast/transcribe/status?id=${transcriptId}`,
          { headers: { Authorization: `Bearer ${secret}` } }
        );
        const data = await res.json();
        if (data.status) setTranscribeStatus(data.status);
        if (data.status === "completed" && data.text) {
          setTranscript(data.text);
          setStep(4);
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        } else if (data.status === "error") {
          setError(data.error || "转录失败");
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch {
        // Retry on next poll
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, transcriptId, secret]);

  // Step 4: Summary complete callback
  const handleSummaryComplete = useCallback(
    (content: string) => {
      setSummary(content);
      if (meta) {
        setEditTitle(meta.title);
        setEditSlug(generateSlug(meta.title));
        setEditTags("播客");
      }
    },
    [meta]
  );

  // Step 5: Publish
  async function handlePublish() {
    if (!meta) return;
    setPublishing(true);
    setError("");
    try {
      const markdown = generateMarkdown({
        title: editTitle,
        slug: editSlug,
        description: meta.description,
        date: new Date().toISOString().split("T")[0],
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        sourceUrl: url,
        platform: meta.platform,
        coverImage: meta.coverImage,
        duration: meta.duration,
        summary,
        discussion: chatHistory
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        transcript,
      });

      // Encode to base64 on client side (handles Chinese correctly)
      const bytes = new TextEncoder().encode(markdown);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const contentBase64 = btoa(binary);

      const res = await fetch("/api/podcast/publish", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ slug: editSlug, contentBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearState();
      alert(`发布成功！Vercel 将在 1-2 分钟后自动重建。\n路径: ${data.path}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  }

  // Export Markdown to local
  function handleExport() {
    if (!meta) return;
    const markdown = generateObsidianMarkdown({
      title: editTitle || meta.title,
      slug: editSlug || generateSlug(meta.title),
      description: meta.description,
      date: new Date().toISOString().split("T")[0],
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      sourceUrl: url,
      platform: meta.platform,
      summary,
    });
    const blob = new Blob([markdown], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${editSlug || "podcast-note"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Reset and start new
  function handleReset() {
    clearState();
    setStep(1);
    setUrl("");
    setMeta(null);
    setTranscriptId("");
    setTranscript("");
    setSummary("");
    setEditTitle("");
    setEditSlug("");
    setEditTags("");
    setChatHistory([]);
    setError("");
    setRestored(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-1">
        {([1, 2, 3, 4, 5] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                  s === step
                    ? "bg-accent text-white"
                    : s < step
                      ? "bg-accent/20 text-accent"
                      : "bg-border text-muted"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${
                s === step ? "text-accent font-medium" : "text-muted"
              }`}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < 4 && (
              <div className={`mx-1 mb-4 h-px w-6 ${
                s < step ? "bg-accent/40" : "bg-border"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Restored state banner */}
      {restored && step >= 2 && (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          <span className="text-accent">
            已恢复上次进度（{meta?.title ? `"${meta.title.slice(0, 30)}..."` : ""}）
          </span>
          <button
            onClick={handleReset}
            className="text-xs text-muted hover:text-foreground"
          >
            重新开始
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: URL + Secret */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">输入播客链接</h2>
          <p className="text-sm text-muted">
            支持小宇宙和 Apple Podcasts
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="体验码"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.xiaoyuzhoufm.com/episode/..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleParse}
            disabled={loading || !url || !secret}
            className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "解析中..." : "解析链接"}
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && meta && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">确认播客信息</h2>
          <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
            {meta.coverImage && (
              <img
                src={meta.coverImage}
                alt={meta.title}
                className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold">{meta.title}</h3>
              <p className="mt-1 text-sm text-muted line-clamp-3">
                {meta.description}
              </p>
              <div className="mt-2 flex gap-3 text-xs text-muted">
                <span>
                  {meta.platform === "xiaoyuzhou" ? "小宇宙" : "Apple Podcasts"}
                </span>
                {meta.duration && (
                  <span>
                    {Math.floor(meta.duration / 60)} 分钟
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              返回
            </button>
            <button
              onClick={handleTranscribe}
              disabled={loading}
              className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "提交中..." : "开始转录"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Transcribing */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-center">正在转录</h2>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                {transcribeStatus === "queued" ? "排队中..." :
                 transcribeStatus === "processing" ? "转录中..." :
                 "处理中..."}
              </span>
              <span>
                {Math.floor(transcribeElapsed / 60)}:{String(transcribeElapsed % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
                style={{
                  width: transcribeStatus === "queued"
                    ? `${Math.min(15, transcribeElapsed * 0.5)}%`
                    : transcribeStatus === "processing"
                      ? `${Math.min(90, 15 + transcribeElapsed * 0.3)}%`
                      : "95%",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>排队</span>
              <span>转录</span>
              <span>完成</span>
            </div>
          </div>

          {/* Status details */}
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                transcribeStatus === "queued" ? "bg-yellow-400 animate-pulse" :
                transcribeStatus === "processing" ? "bg-accent animate-pulse" :
                "bg-muted"
              }`} />
              <span className="text-muted">状态：</span>
              <span className="font-medium">
                {transcribeStatus === "queued" ? "排队等待" :
                 transcribeStatus === "processing" ? "正在转录" :
                 transcribeStatus}
              </span>
            </div>
            {meta?.title && (
              <div className="text-xs text-muted truncate">
                {meta.title}
              </div>
            )}
          </div>

          <p className="text-xs text-muted text-center">
            每 5 秒自动检查状态，刷新页面也不会丢失进度
          </p>
        </div>
      )}

      {/* Step 4: AI Chat */}
      {step === 4 && meta && transcript && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">AI 笔记 & 对话</h2>
            <button
              onClick={() => {
                if (summary) {
                  setEditTitle(meta.title);
                  setEditSlug(generateSlug(meta.title));
                  setEditTags("播客");
                  setStep(5);
                }
              }}
              disabled={!summary}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              下一步：编辑 & 发布
            </button>
          </div>

          {/* Show saved summary if exists */}
          {summary && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">AI 笔记</span>
                <button
                  onClick={() => setSummary("")}
                  className="text-xs text-accent hover:underline"
                >
                  重新生成
                </button>
              </div>
              <div
                className="prose-custom prose-sm max-h-[400px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
              />
            </div>
          )}

          <ChatPanel
            transcript={transcript}
            meta={{ title: meta.title, description: meta.description }}
            systemPrompt={
              summary
                ? buildChatSystemPrompt(transcript, { title: meta.title, description: meta.description })
                : buildSummarySystemPrompt(meta)
            }
            secret={secret}
            onSummaryComplete={summary ? undefined : handleSummaryComplete}
            skipInitialSummary={!!summary}
            onMessagesChange={(msgs) => setChatHistory(msgs)}
          />

          <p className="text-xs text-muted">
            笔记生成后可继续对话，提问细节或要求扩展某个观点
          </p>
        </div>
      )}

      {/* Step 5: Edit & Publish */}
      {step === 5 && meta && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">编辑 & 发布</h2>

          {/* 1. Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-accent">播客总结</h3>
            <div
              className="prose-custom prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
            />
          </div>

          {/* 2. Chat history */}
          {chatHistory.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-accent">深入讨论</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {chatHistory.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`text-sm ${m.role === "user" ? "max-w-[80%]" : "max-w-full w-full"}`}>
                      {m.role === "user" ? (
                        <div className="rounded-2xl rounded-tr-sm bg-accent px-3 py-2 text-white whitespace-pre-wrap">
                          {m.content}
                        </div>
                      ) : (
                        <div
                          className="rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2 prose-custom prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit fields */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-muted">标题</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Slug（URL 路径）</label>
              <input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                标签（逗号分隔）
              </label>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="播客, AI, 产品"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(4)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              返回对话
            </button>
            <button
              onClick={handleExport}
              className="rounded-lg border border-accent px-4 py-2 text-sm text-accent hover:bg-accent/10"
            >
              导出 Markdown
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || !editSlug}
              className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? "发布中..." : "发布到网站"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
