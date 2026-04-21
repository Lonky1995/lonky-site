"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MealCard, Meal } from "./MealCard";

interface MenuData {
  date: string;
  adult: { label: string; meals: Meal[] };
  baby: { label: string; meals: Meal[] };
}

function parseMenuJson(raw: string): MenuData | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export function MenuBoard() {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawBuffer, setRawBuffer] = useState("");

  async function generate() {
    setLoading(true);
    setMenu(null);
    setError(null);
    setRawBuffer("");

    try {
      const res = await fetch("/api/tools/menu", { method: "POST" });
      if (!res.ok) throw new Error("请求失败");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setRawBuffer(accumulated);
      }

      const parsed = parseMenuJson(accumulated);
      if (!parsed) throw new Error("菜谱解析失败，请重试");
      setMenu(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Generate button */}
      <div className="mb-12 flex items-center gap-4">
        <button
          onClick={generate}
          disabled={loading}
          className="group relative border-2 border-foreground bg-card px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all hover:border-accent hover:bg-accent/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              正在生成...
            </span>
          ) : (
            "生成今日菜谱"
          )}
        </button>
        {menu && (
          <span className="text-sm text-muted">{menu.date}</span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && !menu && (
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
        {menu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-8 md:grid-cols-2"
          >
            {/* Adult */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="border-2 border-foreground px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  大人
                </span>
                <span className="text-xs text-muted">{menu.adult.label}</span>
              </div>
              <div className="space-y-4">
                {menu.adult.meals.map((meal, i) => (
                  <MealCard key={i} meal={meal} index={i} />
                ))}
              </div>
            </div>

            {/* Baby */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="border-2 border-accent bg-accent/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
                  宝宝
                </span>
                <span className="text-xs text-muted">{menu.baby.label}</span>
              </div>
              <div className="space-y-4">
                {menu.baby.meals.map((meal, i) => (
                  <MealCard key={i} meal={meal} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && !menu && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-dashed border-foreground/20 p-16 text-center"
        >
          <p className="text-sm text-muted">点击上方按钮，AI 会为你生成今天的菜谱</p>
          <p className="mt-2 text-xs text-muted/60">包含大人菜谱（4人份）和宝宝菜谱（1岁半）</p>
        </motion.div>
      )}
    </div>
  );
}
