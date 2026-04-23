"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MealCard, Meal } from "./MealCard";

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
  adult: AdultMeta[];
  babyBaseNames: string[];
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

  async function generate() {
    setLoading(true);
    setMeta(null);
    setAi(null);
    setError(null);

    try {
      const res = await fetch("/api/tools/menu", { method: "POST" });
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

  return (
    <div className="min-w-0">
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
        {meta && <span className="text-xs text-muted sm:text-sm">{meta.date}</span>}
      </div>

      {/* Loading skeleton */}
      {loading && !hasMenu && (
        <div className="grid gap-8 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 w-32 animate-pulse bg-foreground/10" />
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-48 animate-pulse border-2 border-foreground/20 bg-card/50" />
              ))}
            </div>
          ))}
        </div>
      )}

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
            className="grid gap-10 md:grid-cols-2 md:gap-8"
          >
            {/* Adult */}
            <div>
              <div className="sticky top-16 z-10 -mx-6 mb-4 flex items-center gap-2 border-b border-border/40 bg-background/85 px-6 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
                <span className="border-2 border-foreground px-2.5 py-1 text-xs font-bold uppercase tracking-widest">
                  大人
                </span>
                <span className="text-xs text-muted">4 人份 · HowToCook</span>
              </div>
              <div className="space-y-4">
                {adultMeals.map((meal, i) => (
                  <MealCard key={i} meal={meal} index={i} />
                ))}
              </div>
            </div>

            {/* Baby */}
            <div>
              <div className="sticky top-16 z-10 -mx-6 mb-4 flex items-center gap-2 border-b border-border/40 bg-background/85 px-6 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
                <span className="border-2 border-accent bg-accent/5 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-accent">
                  宝宝
                </span>
                <span className="text-xs text-muted">1 岁半 · 2 人份 · AI 改造</span>
              </div>
              <div className="space-y-4">
                {babyMeals.map((meal, i) => (
                  <MealCard key={i} meal={meal} index={i} />
                ))}
              </div>
            </div>
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
    </div>
  );
}
