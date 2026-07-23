"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// ── 类型（对齐 radar-latest.json v2 schema）──────────
type SignalCard = {
  headline: string;
  why: string;
  author: string;
  handle: string;
  url: string;
  likes: number;
  views: number;
  postedAt: string;
};

type BuzzItem = {
  topic: string;
  gist: string;
  url?: string;
};

type RadarData = {
  generatedAt: string;
  windowHours: number;
  candidateCount: number;
  headlines: SignalCard[];
  insights: SignalCard[];
  buzz: BuzzItem[];
};

// 三段配色
const HEADLINE_ACCENT = "#A3392F"; // 头条 红
const INSIGHT_ACCENT = "#3B6EA5"; // 观点 蓝
const BUZZ_ACCENT = "#4F6B52"; // 热点 绿

// ── 数字缩写（万/k）──────────────────────────────
function fmtNum(n: number): string {
  if (!n) return "0";
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── 段落标题 ──────────────────────────────────────
function SectionHead({ index, emoji, title, sub, accent }: { index: string; emoji: string; title: string; sub: string; accent: string }) {
  return (
    <div className="mb-6 mt-16 flex items-baseline gap-4 border-t-2 border-border pt-4">
      <span className="font-mono text-sm" style={{ color: accent }}>
        {index}
      </span>
      <h2 className="text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
        {emoji} {title}
      </h2>
      <span className="hidden font-mono text-xs text-muted md:inline">{sub}</span>
    </div>
  );
}

// ── 信号卡片（头条 / 观点）────────────────────────
function SignalCardItem({ s, accent }: { s: SignalCard; accent: string }) {
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col border-2 border-border p-5 transition-colors hover:border-accent"
    >
      {/* headline：大字，一眼看清发生了什么 */}
      <h3 className="text-lg font-bold leading-snug md:text-xl">{s.headline}</h3>
      {/* why：为什么重要 / 洞见 */}
      {s.why && (
        <p className="mt-2.5 border-l-4 pl-4 text-[14px] leading-relaxed text-foreground/80" style={{ borderColor: accent }}>
          {s.why}
        </p>
      )}
      {/* 溯源：作者 + 互动 + 时间 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
        <span className="text-foreground/70">@{s.handle}</span>
        <span>· {s.author}</span>
        <span className="ml-auto">❤{fmtNum(s.likes)} · 👁{fmtNum(s.views)}</span>
        <span className="text-accent opacity-0 transition-opacity group-hover:opacity-100">在 X 打开 →</span>
      </div>
    </a>
  );
}

// ── 热点条目 ──────────────────────────────────────
function BuzzRow({ b }: { b: BuzzItem }) {
  const inner = (
    <div className="flex flex-col border-2 border-border p-4 transition-colors group-hover:border-accent">
      <div className="font-bold" style={{ color: BUZZ_ACCENT }}>
        {b.topic}
      </div>
      <p className="mt-1.5 text-[14px] leading-relaxed text-foreground/80">{b.gist}</p>
    </div>
  );
  return b.url ? (
    <a href={b.url} target="_blank" rel="noopener noreferrer" className="group block">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}

// ── 主组件 ────────────────────────────────────────
export default function RadarDashboard() {
  const [data, setData] = useState<RadarData | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const loadData = () =>
    fetch(`/data/radar-latest.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((d: RadarData) => {
        setData(d);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/dashboard/radar-refresh", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setRefreshMsg(body?.error || "刷新失败");
        return;
      }
      await loadData();
      setRefreshMsg("已刷新");
    } catch {
      setRefreshMsg("刷新失败，请稍后再试");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMsg(null), 4000);
    }
  };

  const isEmpty = data && data.headlines.length === 0 && data.insights.length === 0 && data.buzz.length === 0;

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-10 md:px-8">
      {/* ── 页头 ── */}
      <header>
        <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Link href="/" className="hover:text-accent">
            ← lonky.me
          </Link>
          <div className="flex items-center gap-3">
            <span>{data ? `更新于 ${fmtTime(data.generatedAt)}` : "X · Radar"}</span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="border border-border px-2 py-1 normal-case tracking-normal transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "刷新中…" : "↻ 手动刷新"}
            </button>
            {refreshMsg && <span className="text-accent">{refreshMsg}</span>}
          </div>
        </div>
        <div className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">X / Twitter ▸ 近 48 小时 ▸ AI 精选</div>
        <h1 className="mt-3 font-extrabold uppercase leading-[0.9] tracking-tight" style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}>
          X 情报
          <br />
          <span className="text-accent">雷达</span>
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed">
          AI 从近 48 小时关注流里筛出真正重要的——重大事件、独到观点、热门讨论。滤掉噪音，只留信号。
        </p>
      </header>

      {/* ── 内容三态 ── */}
      {status === "loading" && <p className="mt-16 font-mono text-sm text-muted">加载中…</p>}

      {status === "error" && (
        <div className="mt-16 border-2 border-border p-8 text-center">
          <p className="font-mono text-sm text-muted">看板数据暂未生成，请稍后再来。</p>
        </div>
      )}

      {status === "loaded" && data && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {isEmpty && <p className="mt-16 font-mono text-sm text-muted">今日暂无重大信号。</p>}

          {/* 🔥 今日头条 */}
          {data.headlines.length > 0 && (
            <section>
              <SectionHead index="01" emoji="🔥" title="今日头条" sub="最重要的事 · 按重要性排序" accent={HEADLINE_ACCENT} />
              <div className="grid grid-cols-1 gap-4">
                {data.headlines.map((s) => (
                  <SignalCardItem key={s.url} s={s} accent={HEADLINE_ACCENT} />
                ))}
              </div>
            </section>
          )}

          {/* 💡 值得一读 */}
          {data.insights.length > 0 && (
            <section>
              <SectionHead index="02" emoji="💡" title="值得一读" sub="独到观点 · 深度分析" accent={INSIGHT_ACCENT} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.insights.map((s) => (
                  <SignalCardItem key={s.url} s={s} accent={INSIGHT_ACCENT} />
                ))}
              </div>
            </section>
          )}

          {/* 📊 在讨论什么 */}
          {data.buzz.length > 0 && (
            <section>
              <SectionHead index="03" emoji="📊" title="在讨论什么" sub="热点话题 · 共识与争议" accent={BUZZ_ACCENT} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.buzz.map((b, i) => (
                  <BuzzRow key={b.url ?? i} b={b} />
                ))}
              </div>
            </section>
          )}

          <footer className="mt-20 border-t-2 border-border pt-4 font-mono text-xs text-muted">
            从近 {data.windowHours} 小时 {data.candidateCount} 条关注流推文中精选 · 每 12 小时自动更新（08:00 / 20:00）
          </footer>
        </motion.div>
      )}
    </main>
  );
}
