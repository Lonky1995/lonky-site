"use client";

import { useEffect, useState } from "react";

// 股票追踪日记：像写日记一样对标的记录追踪/心情，追加式时间线。

type Mood = "confident" | "calm" | "anxious" | "greedy" | "fearful" | "neutral";
type Entry = { id: string; symbol: string; mood: Mood; content: string; createdAt: number };

const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: "confident", emoji: "💪", label: "有信心" },
  { key: "calm", emoji: "😌", label: "平静" },
  { key: "neutral", emoji: "😐", label: "中性" },
  { key: "anxious", emoji: "😰", label: "焦虑" },
  { key: "greedy", emoji: "🤑", label: "贪婪" },
  { key: "fearful", emoji: "😱", label: "恐惧" },
];
const moodMeta = (m: Mood) => MOODS.find((x) => x.key === m) ?? MOODS[2];

const inputCls =
  "w-full border-2 border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function JournalPanel({ lockedSymbol }: { lockedSymbol?: string } = {}) {
  const locked = (lockedSymbol ?? "").trim().toUpperCase();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");
  const [content, setContent] = useState("");
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const url = locked
      ? `/api/portfolio/journal/list?symbol=${encodeURIComponent(locked)}`
      : "/api/portfolio/journal/list";
    fetch(url)
      .then((r) => r.json())
      .then((d: { entries?: Entry[] }) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    queueMicrotask(() => setPasscode(sessionStorage.getItem("pf_passcode") || ""));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const submit = async () => {
    setError(null);
    if (!content.trim()) {
      setError("请写点什么");
      return;
    }
    if (!passcode.trim()) {
      setError("请填写密码");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio/journal/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: passcode.trim(),
          symbol: locked || symbol.trim().replace(/^\$/, "").toUpperCase() || "GENERAL",
          mood,
          content: content.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `提交失败（${res.status}）`);
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem("pf_passcode", passcode.trim());
      setContent("");
      setSymbol("");
      setMood("neutral");
      setSubmitting(false);
      setTimeout(load, 3000); // Vercel 部署延迟后重拉
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 录入区 */}
      <div className="border-2 border-border p-5">
        <div className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">写一条追踪</div>
        <div className="space-y-4">
          <div className={`grid gap-4 ${locked ? "grid-cols-1" : "grid-cols-2"}`}>
            {!locked && (
              <input
                className={`${inputCls} uppercase`}
                placeholder="标的（留空=大盘/整体）"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            )}
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  title={m.label}
                  className={`border-2 px-2 py-1 text-sm transition-colors ${
                    mood === m.key ? "border-accent bg-accent/15" : "border-border hover:border-accent/50"
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            placeholder="今天对这个标的的想法、观察、情绪…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <input
              type="password"
              className={`${inputCls} max-w-[200px]`}
              placeholder="密码"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
            <button
              onClick={submit}
              disabled={submitting}
              className="border-2 border-accent bg-accent/20 px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent hover:bg-accent/30 disabled:opacity-50"
            >
              {submitting ? "提交中…" : "记录"}
            </button>
          </div>
          {error && (
            <div className="border-2 border-red-500/50 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">{error}</div>
          )}
        </div>
      </div>

      {/* 时间线 */}
      <div>
        <div className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">追踪时间线</div>
        {loading ? (
          <div className="py-8 text-center font-mono text-sm text-muted">加载中…</div>
        ) : entries.length === 0 ? (
          <div className="border-2 border-border p-6 text-sm text-muted">还没有追踪记录，写第一条吧。</div>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => {
              const mm = moodMeta(e.mood);
              return (
                <div key={e.id} className="border-2 border-border p-4">
                  <div className="mb-2 flex items-center gap-2 font-mono text-xs">
                    <span className="text-base">{mm.emoji}</span>
                    <span className="font-bold">{e.symbol}</span>
                    <span className="text-muted">{mm.label}</span>
                    <span className="ml-auto text-muted">{fmtTime(e.createdAt)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{e.content}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
