"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MealCard, Meal } from "./MealCard";
import { CookingAnimation } from "./CookingAnimation";
import { ShareImage } from "./ShareImage";
import { saveMenu, type MenuRecord } from "@/lib/menu/storage";
import { toPng } from "html-to-image";

interface AdultMeta {
  name: string;
  category: string;
  ingredients: string[];
  steps: string[];
  sourceUrl: string;
  difficulty: number;
}

interface MenuMeta {
  date: string;
  adults: number;
  babies: number;
  adult: AdultMeta[];
  babyBaseNames: string[];
}

const SETTINGS_KEY = "menu-family-settings";

function loadSettings(): { adults: number; babies: number } {
  if (typeof window === "undefined") return { adults: 4, babies: 2 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        adults: Math.max(1, Math.min(10, s.adults ?? 4)),
        babies: Math.max(0, Math.min(4, s.babies ?? 2)),
      };
    }
  } catch {
    // ignore
  }
  return { adults: 4, babies: 2 };
}

interface AIResponse {
  adult_tags?: Record<string, string>;
  baby_meals?: Array<{
    name: string;
    based_on?: string;
    category: string;
    nutrition?: string;
    ingredients: string[];
    steps: string[];
  }>;
}

function parseAIJson(raw: string): AIResponse | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export function MenuBoard() {
  const [meta, setMeta] = useState<MenuMeta | null>(null);
  const [ai, setAi] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [adults, setAdults] = useState(4);
  const [babies, setBabies] = useState(2);
  const shareRef = useRef<HTMLDivElement>(null);

  // 首次挂载读取上次设置
  useEffect(() => {
    const s = loadSettings();
    setAdults(s.adults);
    setBabies(s.babies);
  }, []);

  // 设置变化时持久化
  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ adults, babies }),
      );
    } catch {
      // ignore
    }
  }, [adults, babies]);

  async function generate() {
    setLoading(true);
    setMeta(null);
    setAi(null);
    setError(null);

    try {
      const res = await fetch("/api/tools/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adults, babies }),
      });
      if (!res.ok) throw new Error("请求失败");

      const metaHeader = res.headers.get("X-Menu-Meta");
      if (metaHeader) {
        try {
          setMeta(JSON.parse(decodeURIComponent(metaHeader)));
        } catch {
          // ignore
        }
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      const parsed = parseAIJson(accumulated);
      if (!parsed) throw new Error("AI 响应解析失败，请重试");
      setAi(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const adultMeals: Meal[] = meta
    ? meta.adult.map((r) => ({
        name: r.name,
        category: r.category,
        nutrition: ai?.adult_tags?.[r.name],
        ingredients: r.ingredients,
        steps: r.steps,
        sourceUrl: r.sourceUrl,
        difficulty: r.difficulty,
      }))
    : [];

  const babyMeals: Meal[] = ai?.baby_meals
    ? ai.baby_meals.map((m) => ({
        name: m.name,
        basedOn: m.based_on,
        category: m.category,
        nutrition: m.nutrition,
        ingredients: m.ingredients,
        steps: m.steps,
      }))
    : [];

  const hasMenu = meta && ai;

  // 构建当前菜谱的 Record（供自动保存和分享用）
  const currentRecord: MenuRecord | null = hasMenu
    ? {
        date: new Date().toISOString().slice(0, 10),
        dateLabel: meta!.date,
        adults: meta!.adults,
        babies: meta!.babies,
        adult: adultMeals.map((m) => ({
          name: m.name,
          category: m.category,
          ingredients: m.ingredients,
          steps: m.steps,
          sourceUrl: m.sourceUrl,
          difficulty: m.difficulty,
          nutrition: m.nutrition,
        })),
        baby: babyMeals.map((m) => ({
          name: m.name,
          basedOn: m.basedOn,
          category: m.category,
          nutrition: m.nutrition,
          ingredients: m.ingredients,
          steps: m.steps,
        })),
        savedAt: Date.now(),
      }
    : null;

  // 生成完成后自动保存到 localStorage
  useEffect(() => {
    if (currentRecord) {
      saveMenu(currentRecord);
    }
    // 仅在 hasMenu 变化时保存一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMenu]);

  async function shareAsImage() {
    if (!shareRef.current || sharing) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(shareRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#F4F0E6",
      });

      // 手机：尝试用 Web Share API 分享 blob
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `菜谱-${currentRecord?.date}.png`, {
        type: "image/png",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "陈绚妮家的今日菜谱",
        });
      } else {
        // 降级：直接下载
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `菜谱-${currentRecord?.date}.png`;
        a.click();
      }
    } catch {
      // 用户取消分享或失败，静默
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-w-0">
      {/* 家庭人数设置 */}
      <div className="mb-5 flex flex-wrap items-center gap-3 sm:gap-5">
        <Counter
          label="大人"
          value={adults}
          min={1}
          max={10}
          onChange={setAdults}
        />
        <Counter
          label="宝宝"
          value={babies}
          min={0}
          max={4}
          onChange={setBabies}
          accent
        />
        <span className="text-xs text-muted">
          {adults <= 1
            ? "1 菜 1 汤 1 主食"
            : `${Math.ceil(adults / 2)} 荤 ${Math.floor(adults / 2)} 素 1 汤 1 主食`}
          {babies > 0 && " · 宝宝专属"}
        </span>
      </div>

      {/* Generate button */}
      <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-center sm:gap-4">
        <button
          onClick={generate}
          disabled={loading}
          className="group relative w-full border-2 border-foreground bg-card px-6 py-3.5 text-sm font-bold uppercase tracking-widest transition-all hover:border-accent hover:bg-accent/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-8 sm:py-4"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              正在生成...
            </span>
          ) : (
            "生成今日菜谱"
          )}
        </button>

        {hasMenu && (
          <button
            onClick={shareAsImage}
            disabled={sharing}
            className="w-full border-2 border-accent bg-accent/5 px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-accent transition-all hover:bg-accent/10 active:scale-[0.98] disabled:opacity-50 sm:w-auto sm:px-8 sm:py-4"
          >
            {sharing ? "生成图片中..." : "分享为图片"}
          </button>
        )}

        {meta && <span className="text-xs text-muted sm:text-sm">{meta.date}</span>}

        <Link
          href="/menu/history"
          className="ml-auto text-xs text-muted underline underline-offset-4 transition-colors hover:text-accent sm:text-sm"
        >
          查看历史 →
        </Link>
      </div>

      {/* Loading animation */}
      {loading && !hasMenu && <CookingAnimation />}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-2 border-foreground bg-card p-6 text-sm text-muted"
        >
          {error}
        </motion.div>
      )}

      {/* Menu grid */}
      <AnimatePresence>
        {hasMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`grid gap-10 md:gap-8 ${babyMeals.length > 0 ? "md:grid-cols-2" : "md:grid-cols-1"}`}
          >
            {/* Adult */}
            <div>
              <div className="sticky top-16 z-10 mb-4 flex items-center gap-2 border-b border-border/40 bg-background/85 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:py-0 md:backdrop-blur-none">
                <span className="border-2 border-foreground px-2.5 py-1 text-xs font-bold uppercase tracking-widest">
                  大人
                </span>
                <span className="text-xs text-muted">{meta?.adults ?? adults} 人份 · HowToCook</span>
              </div>
              <div className="space-y-4">
                {adultMeals.map((meal, i) => (
                  <MealCard key={i} meal={meal} index={i} />
                ))}
              </div>
            </div>

            {/* Baby */}
            {babyMeals.length > 0 && (
              <div>
                <div className="sticky top-16 z-10 mb-4 flex items-center gap-2 border-b border-border/40 bg-background/85 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:py-0 md:backdrop-blur-none">
                  <span className="border-2 border-accent bg-accent/5 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-accent">
                    宝宝
                  </span>
                  <span className="text-xs text-muted">1 岁半 · {meta?.babies ?? babies} 人份 · AI 改造</span>
                </div>
                <div className="space-y-4">
                  {babyMeals.map((meal, i) => (
                    <MealCard key={i} meal={meal} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && !hasMenu && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-dashed border-foreground/20 p-16 text-center"
        >
          <p className="text-sm text-muted">点击上方按钮，从 266 道家常菜中随机搭配今日菜谱</p>
          <p className="mt-2 text-xs text-muted/60">
            大人菜谱来自{" "}
            <a
              href="https://github.com/Anduin2017/HowToCook"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2"
            >
              HowToCook
            </a>
            ，宝宝菜谱由 AI 基于成人菜改造（不加盐、软烂、无刺激调料）
          </p>
        </motion.div>
      )}

      {/* 离屏分享图渲染区（不可见但参与布局以便导出） */}
      {currentRecord && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <ShareImage ref={shareRef} record={currentRecord} />
        </div>
      )}
    </div>
  );
}

function Counter({
  label,
  value,
  min,
  max,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accent?: boolean;
}) {
  const canDec = value > min;
  const canInc = value < max;
  const borderClass = accent ? "border-accent" : "border-foreground";
  const textClass = accent ? "text-accent" : "text-foreground";

  return (
    <div className={`inline-flex items-stretch border-2 ${borderClass}`}>
      <span
        className={`flex items-center gap-1.5 border-r-2 ${borderClass} px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${textClass}`}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={() => canDec && onChange(value - 1)}
        disabled={!canDec}
        className={`flex h-9 w-9 items-center justify-center border-r-2 ${borderClass} text-base transition-colors hover:bg-accent/5 disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label={`减少${label}`}
      >
        −
      </button>
      <span
        className={`flex h-9 min-w-[2.25rem] items-center justify-center px-2 text-sm font-bold tabular-nums ${textClass}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => canInc && onChange(value + 1)}
        disabled={!canInc}
        className={`flex h-9 w-9 items-center justify-center border-l-2 ${borderClass} text-base transition-colors hover:bg-accent/5 disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label={`增加${label}`}
      >
        +
      </button>
    </div>
  );
}
