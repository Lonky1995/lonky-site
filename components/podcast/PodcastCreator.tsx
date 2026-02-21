"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChatPanel } from "./ChatPanel";
import { TetrisGame } from "./TetrisGame";
import {
  buildSummarySystemPrompt,
  buildChatSystemPrompt,
  buildDiscussionSummaryPrompt,
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
  const [showPreview, setShowPreview] = useState(false);

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

      // Cache hit — already completed, fetch text and skip to Step 4
      if (data.cached && data.status === "completed") {
        const statusRes = await fetch(
          `/api/podcast/transcribe/status?id=${data.transcriptId}`,
          { headers: { Authorization: `Bearer ${secret}` } }
        );
        const statusData = await statusRes.json();
        if (statusData.status === "completed" && statusData.text) {
          setTranscript(statusData.text);
          setStep(4);
          return;
        }
      }

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

  // Step 4: Generate summary independently (stream from API, not via ChatPanel)
  const summaryAbortRef = useRef<AbortController | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const generateSummary = useCallback(async () => {
    if (!meta || !transcript) return;
    setSummaryLoading(true);
    setSummary("");
    try {
      summaryAbortRef.current = new AbortController();
      const systemPrompt = buildSummarySystemPrompt(meta, transcript);
      const res = await fetch("/api/podcast/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: "user", content: "请根据转录内容，生成结构化播客笔记。" }],
        }),
        signal: summaryAbortRef.current.signal,
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value, { stream: true });
        setSummary(fullContent);
      }
      // Set publish fields
      setEditTitle(meta.title);
      setEditSlug(generateSlug(meta.title));
      setEditTags("播客笔记");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(`笔记生成失败: ${(e as Error).message}`);
      }
    } finally {
      setSummaryLoading(false);
    }
  }, [meta, transcript, secret]);

  // Auto-generate summary when entering Step 4 without one
  useEffect(() => {
    if (step === 4 && !summary && transcript && meta && !summaryLoading) {
      generateSummary();
    }
  }, [step, transcript, meta]);

  // Summarize discussion via AI
  async function summarizeDiscussion(): Promise<string> {
    if (!meta || chatHistory.length === 0) return "";
    const discussionMessages = chatHistory
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));
    if (discussionMessages.length === 0) return "";

    // Build a single user message with the full discussion for summarization
    const rawDiscussion = discussionMessages
      .map((m) => (m.role === "user" ? `用户：${m.content}` : `AI：${m.content}`))
      .join("\n\n---\n\n");

    const res = await fetch("/api/podcast/chat", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        system: buildDiscussionSummaryPrompt({ title: meta.title, description: meta.description }),
        messages: [{ role: "user", content: `以下是用户和 AI 的完整讨论记录：\n\n${rawDiscussion}` }],
      }),
    });

    if (!res.ok) throw new Error("讨论总结失败");

    // Read the stream to completion
    const reader = res.body?.getReader();
    if (!reader) return "";
    const decoder = new TextDecoder();
    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    return result;
  }

  // Step 5: Publish
  async function handlePublish() {
    if (!meta) return;
    setPublishing(true);
    setError("");
    try {
      // Summarize discussion before generating markdown
      let discussionSummary = "";
      if (chatHistory.length > 0) {
        discussionSummary = await summarizeDiscussion();
      }

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
        discussionSummary,
        discussion: chatHistory
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
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
          {/* Secret first */}
          <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3">
            <h2 className="text-base font-semibold text-foreground">体验码</h2>
            <p className="text-sm text-muted">
              为避免 API 被滥用，请联系 Lonky 获取体验码后使用
            </p>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="输入体验码"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {/* URL input */}
          <h2 className="text-xl font-bold">输入播客链接</h2>
          <p className="text-sm text-muted">
            支持小宇宙和 Apple Podcasts
          </p>
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

          {/* How it works */}
          <div className="mt-16">
            <h2 className="mb-10 text-center text-2xl font-bold">
              <span className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
                How it works
              </span>
            </h2>
            <div className="relative flex flex-col items-center gap-0 md:flex-row md:items-start md:justify-between md:gap-0">
              <div className="absolute left-[10%] right-[10%] top-8 hidden h-[2px] bg-gradient-to-r from-[#6366f1]/10 via-[#6366f1]/50 to-[#6366f1]/10 md:block" />
              <div className="absolute bottom-0 left-8 top-0 w-[2px] bg-gradient-to-b from-[#6366f1]/10 via-[#6366f1]/50 to-[#6366f1]/10 md:hidden" />
              {[
                { icon: "🔗", title: "贴入链接", desc: "粘贴小宇宙 / Apple Podcasts 链接" },
                { icon: "🎙️", title: "自动转录", desc: "AI 语音识别，生成完整文字稿" },
                { icon: "📝", title: "结构化笔记", desc: "AI 提炼要点，生成结构化笔记" },
                { icon: "💬", title: "和 AI 深入讨论", desc: "基于内容与 AI 对话，追问细节" },
                { icon: "🚀", title: "一键生成", desc: "生成播客笔记，方便回顾" },
              ].map((s, i, arr) => (
                <div
                  key={s.title}
                  className="relative z-10 flex items-start gap-4 py-4 md:flex-col md:items-center md:gap-0 md:py-0"
                  style={{ flex: 1 }}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#6366f1]/20 bg-[#111827] text-2xl shadow-lg shadow-[#6366f1]/10">
                    {s.icon}
                  </div>
                  <div className="md:mt-4 md:text-center">
                    <p className="text-sm font-semibold text-[#f1f5f9]">{s.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#94a3b8] md:max-w-[120px]">{s.desc}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <svg className="absolute -right-3 top-6 hidden h-6 w-6 text-[#6366f1]/70 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
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
        <div className="space-y-5">
          {/* Compact status + progress card */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${
                  transcribeStatus === "queued" ? "bg-yellow-400 animate-pulse" :
                  transcribeStatus === "processing" ? "bg-accent animate-pulse" :
                  "bg-muted"
                }`} />
                <span className="font-medium">
                  {transcribeStatus === "queued" ? "排队等待中" :
                   transcribeStatus === "processing" ? "正在转录" :
                   transcribeStatus}
                </span>
              </div>
              <span className="text-xs tabular-nums text-muted">
                {Math.floor(transcribeElapsed / 60)}:{String(transcribeElapsed % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
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
            {meta?.title && (
              <p className="text-xs text-muted truncate">{meta.title}</p>
            )}
            <div className="flex items-center justify-between text-[10px] text-muted pt-1">
              <span>每 5 秒自动检查 · 刷新不丢失</span>
              <button
                onClick={() => {
                  clearState();
                  setStep(1);
                  setTranscriptId("");
                  setTranscribeStatus("queued");
                  setTranscribeElapsed(0);
                }}
                className="text-muted hover:text-red-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>

          {/* Mini game while waiting */}
          <TetrisGame />
        </div>
      )}

      {/* Step 4: AI Chat */}
      {step === 4 && meta && transcript && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">AI 笔记 & 对话</h2>

          {/* Audio player */}
          {meta.audioUrl && <AudioPlayer audioUrl={meta.audioUrl} />}

{/* AI Summary card */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">AI 笔记</span>
              {summary && !summaryLoading && (
                <button
                  onClick={generateSummary}
                  className="text-xs text-accent hover:underline"
                >
                  重新生成
                </button>
              )}
            </div>
            {summaryLoading && !summary && (
              <div className="text-sm text-muted animate-pulse">AI 正在生成笔记...</div>
            )}
            {summary && (
              <div
                className="prose-custom prose-sm max-h-[400px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
              />
            )}
          </div>

          <p className="text-xs text-muted">
            笔记生成后可继续对话，提问细节或要求扩展某个观点
          </p>

          <ChatPanel
            transcript={transcript}
            meta={{ title: meta.title, description: meta.description }}
            systemPrompt={buildChatSystemPrompt(transcript, { title: meta.title, description: meta.description })}
            secret={secret}
            initialMessages={restored && chatHistory.length > 0 ? chatHistory.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })) : undefined}
            onMessagesChange={(msgs) => setChatHistory(msgs)}
          />

          <button
            onClick={() => {
              if (summary) {
                setEditTitle(meta.title);
                setEditSlug(generateSlug(meta.title));
                setEditTags("播客笔记");
                setStep(5);
              }
            }}
            disabled={!summary}
            className="w-full rounded-lg border border-border px-6 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
          >
            下一步：编辑 & 发布
          </button>
        </div>
      )}

      {/* Step 5: Edit & Publish */}
      {step === 5 && meta && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">编辑 & 发布</h2>

          {/* 1. Summary — AI 客观提炼 */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-accent/15 text-xs text-accent">AI</span>
              <h3 className="text-sm font-semibold text-foreground">播客总结</h3>
              <span className="text-xs text-muted">— AI 基于转录生成的结构化笔记</span>
            </div>
            <div
              className="prose-custom prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
            />
          </div>

          {/* 2. Discussion — 用户主观思考 */}
          {chatHistory.length > 0 && (
            <DiscussionSection chatHistory={chatHistory} />
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

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setStep(4)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              返回对话
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              预览最终效果
            </button>
            <button
              onClick={handleExport}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              导出播客 AI 总结
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || !editSlug}
              className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? (chatHistory.length > 0 ? "总结讨论 & 发布中..." : "发布中...") : "发布到网站"}
            </button>
          </div>
          <p className="text-[11px] text-muted">仅管理员可发布，访客可导出 Markdown 到本地</p>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && meta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-background p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 text-muted hover:text-foreground"
            >
              ✕
            </button>

            {/* Simulated detail page */}
            <article>
              <div className="mb-8">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-accent">播客笔记</span>
                  <span className="text-sm text-muted">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                    {meta.platform === "xiaoyuzhou" ? "小宇宙" : "Apple Podcasts"}
                  </span>
                  {meta.duration && (
                    <span className="text-sm text-muted">
                      {Math.floor(meta.duration / 60)} min
                    </span>
                  )}
                </div>
                <h1 className="mb-4 text-3xl font-bold">{editTitle || meta.title}</h1>
                <p className="text-lg text-muted">{meta.description}</p>
                {editTags && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {editTags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* TOC */}
              <PreviewToc summary={summary} chatHistory={chatHistory} />

              <div
                className="prose-custom"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
              />
              {chatHistory.length > 0 && (
                <div className="mt-8">
                  <h2 id="preview-discussion" className="mb-4 text-lg font-bold">和 AI 深入讨论</h2>
                  <DiscussionSection chatHistory={chatHistory} />
                </div>
              )}
            </article>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscussionSection({ chatHistory }: { chatHistory: { id: string; role: string; content: string }[] }) {
  const [showRaw, setShowRaw] = useState(false);

  // Pair up Q&A: each user message + following assistant message
  const pairs: { question: string; answer: string; idx: number }[] = [];
  for (let i = 0; i < chatHistory.length; i++) {
    if (chatHistory[i].role === "user") {
      pairs.push({
        question: chatHistory[i].content,
        answer: chatHistory[i + 1]?.role === "assistant" ? chatHistory[i + 1].content : "",
        idx: i,
      });
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-accent/15 text-xs">💭</span>
          <h3 className="text-sm font-semibold text-foreground">我的思考</h3>
          <span className="text-xs text-muted">— 听完后的追问与讨论</span>
        </div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-muted hover:text-foreground"
        >
          {showRaw ? "精简视图" : "查看原始对话"}
        </button>
      </div>

      {showRaw ? (
        /* Raw chat view */
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {chatHistory.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`text-sm ${m.role === "user" ? "max-w-[80%]" : "max-w-full w-full"}`}>
                {m.role === "user" ? (
                  <div className="rounded-2xl rounded-tr-sm bg-accent/15 px-3 py-2 text-foreground whitespace-pre-wrap">
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
      ) : (
        /* Condensed Q&A view */
        <div className="space-y-5 max-h-[400px] overflow-y-auto">
          {pairs.map((pair, i) => (
            <div key={i} id={`preview-q-${pair.idx}`} className="flex flex-col gap-2">
              {/* Question — right-aligned bubble */}
              <div className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-accent/15 px-4 py-2.5">
                <p className="text-sm font-medium text-foreground whitespace-pre-wrap">🙋 {pair.question}</p>
              </div>
              {/* Answer — left-aligned bubble */}
              {pair.answer && (
                <div className="self-start max-w-[95%] rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-3">
                  <p className="text-[10px] font-semibold text-accent mb-1.5">AI</p>
                  <div
                    className="text-sm prose-custom prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(pair.answer) }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const seconds = (e as CustomEvent<number>).detail;
      if (audioRef.current) {
        audioRef.current.currentTime = seconds;
        audioRef.current.play();
      }
    };
    document.addEventListener("podcast-seek", handler);
    return () => document.removeEventListener("podcast-seek", handler);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  function seek(e: React.MouseEvent) {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={toggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l10-5.5z"/></svg>
        )}
      </button>
      <span className="text-xs tabular-nums text-muted w-10 shrink-0">{fmt(current)}</span>
      <div
        ref={progressRef}
        onClick={seek}
        className="relative flex-1 h-1.5 cursor-pointer rounded-full bg-border"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted w-10 shrink-0 text-right">{duration > 0 ? fmt(duration) : "--:--"}</span>
    </div>
  );
}

function PreviewToc({ summary, chatHistory }: { summary: string; chatHistory: { id: string; role: string; content: string }[] }) {
  type TocItem = { id: string; text: string; level: 2 | 3 };
  const items: TocItem[] = [];
  const lines = summary.split("\n");
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      const text = match[1].replace(/\*\*/g, "").trim();
      const id = "preview-" + text.replace(/[^\w\u4e00-\u9fff\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
      items.push({ id, text, level: 2 });
    }
  }
  if (chatHistory.length > 0) {
    items.push({ id: "preview-discussion", text: "和 AI 深入讨论", level: 2 });
    // Extract discussion questions as sub-items
    for (let i = 0; i < chatHistory.length; i++) {
      if (chatHistory[i].role === "user") {
        const q = chatHistory[i].content.slice(0, 40) + (chatHistory[i].content.length > 40 ? "..." : "");
        const qId = "preview-q-" + i;
        items.push({ id: qId, text: q, level: 3 });
      }
    }
  }
  if (items.length === 0) return null;

  return (
    <nav className="mb-8 rounded-lg border border-border bg-card/50 p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">目录</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${item.id}`}
              className={`transition-colors hover:text-accent ${
                item.level === 3 ? "text-xs text-muted/70" : "text-sm text-muted"
              }`}
            >
              {item.level === 3 ? `💬 ${item.text}` : item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
