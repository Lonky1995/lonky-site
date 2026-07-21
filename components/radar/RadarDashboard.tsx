"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// ── 类型（对齐 radar-latest.json schema）──────────
type TweetCard = {
  author: string;
  handle: string;
  text: string;
  url: string;
  likes: number;
  reposts: number;
  views: number;
  postedAt: string;
};

type Domain = {
  key: string;
  label: string;
  isAnchor: boolean;
  summary: string;
  tweets: TweetCard[];
};

type RadarData = {
  generatedAt: string;
  windowHours: number;
  candidateCount: number;
  domains: Domain[];
};

// ── 领域配色（锚点各一色，动态领域统一强调色）──────
const DOMAIN_ACCENT: Record<string, string> = {
  ai: "#4F6B52", // 绿
  crypto: "#B8860B", // 金
  "product-eng": "#3B6EA5", // 蓝
};
const DYNAMIC_ACCENT = "#A3392F"; // 动态领域用红

function accentOf(d: Domain): string {
  return DOMAIN_ACCENT[d.key] ?? DYNAMIC_ACCENT;
}

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

// ── 单条推文卡片 ──────────────────────────────────
function TweetCardItem({ t }: { t: TweetCard }) {
  return (
    <a
      href={t.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col border-2 border-border p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="font-bold">{t.author}</span>
          <span className="ml-1.5 font-mono text-[12px] text-muted">@{t.handle}</span>
        </div>
        <div className="shrink-0 font-mono text-[11px] text-muted">
          ❤{fmtNum(t.likes)} · 🔁{fmtNum(t.reposts)} · 👁{fmtNum(t.views)}
        </div>
      </div>
      <p className="mt-2 flex-1 text-[14px] leading-relaxed text-foreground/85">{t.text}</p>
      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted">
        <span>{t.postedAt}</span>
        <span className="text-accent opacity-0 transition-opacity group-hover:opacity-100">在 X 打开 →</span>
      </div>
    </a>
  );
}

// ── 领域区块 ──────────────────────────────────────
function DomainSection({ d, index }: { d: Domain; index: number }) {
  const accent = accentOf(d);
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-baseline gap-4 border-t-2 border-border pt-4">
        <span className="font-mono text-sm" style={{ color: accent }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 className="text-2xl font-extrabold uppercase tracking-tight md:text-3xl">{d.label}</h2>
        {!d.isAnchor && (
          <span className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-background" style={{ background: accent }}>
            今日新增
          </span>
        )}
      </div>
      {d.summary && (
        <p className="mb-6 max-w-3xl border-l-4 pl-5 font-serif text-lg leading-relaxed" style={{ borderColor: accent }}>
          {d.summary}
        </p>
      )}
      {d.tweets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {d.tweets.map((t) => (
            <TweetCardItem key={t.url} t={t} />
          ))}
        </div>
      ) : (
        <p className="font-mono text-sm text-muted">今日暂无相关内容</p>
      )}
    </section>
  );
}

// ── 主组件 ────────────────────────────────────────
export default function RadarDashboard() {
  const [data, setData] = useState<RadarData | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    fetch("/data/radar-latest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((d: RadarData) => {
        setData(d);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-8">
      {/* ── 页头 ── */}
      <header>
        <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Link href="/" className="hover:text-accent">
            ← lonky.me
          </Link>
          <span>{data ? `更新于 ${fmtTime(data.generatedAt)}` : "X · Radar"}</span>
        </div>
        <div className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">X / Twitter ▸ 近 48 小时 ▸ AI 分类</div>
        <h1 className="mt-3 font-extrabold uppercase leading-[0.9] tracking-tight" style={{ fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}>
          X 情报
          <br />
          <span className="text-accent">雷达</span>
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed">
          每天自动聚合近 48 小时关注列表的高互动内容，用 AI 按领域分类，一屏掌握当日动态。
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
          {data.domains.map((d, i) => (
            <DomainSection key={d.key} d={d} index={i} />
          ))}

          <footer className="mt-20 border-t-2 border-border pt-4 font-mono text-xs text-muted">
            从近 {data.windowHours} 小时 {data.candidateCount} 条高互动推文中筛选 · 每日 08:00 自动更新
          </footer>
        </motion.div>
      )}
    </main>
  );
}
