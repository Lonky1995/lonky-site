"use client";

import { motion } from "framer-motion";

export interface Meal {
  name: string;
  category: string;
  nutrition?: string;
  ingredients: string[];
  steps: string[];
  sourceUrl?: string;
  difficulty?: number;
  basedOn?: string;
}

export function MealCard({ meal, index }: { meal: Meal; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="overflow-hidden border-2 border-foreground bg-card p-4 sm:p-5"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-tight text-foreground sm:text-base">
            {meal.name}
          </h3>
          {meal.basedOn && (
            <p className="mt-1 text-xs text-muted">改自：{meal.basedOn}</p>
          )}
          {/* 移动端把分类和星级放在标题下方一行，节省右侧空间 */}
          <div className="mt-1.5 flex items-center gap-2 text-xs sm:hidden">
            <span className="font-medium text-accent">{meal.category}</span>
            {typeof meal.difficulty === "number" && meal.difficulty > 0 && (
              <span className="text-muted">{"★".repeat(meal.difficulty)}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="hidden text-xs font-medium text-accent sm:inline">
            {meal.category}
          </span>
          {meal.nutrition && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] leading-tight text-accent sm:text-xs">
              {meal.nutrition}
            </span>
          )}
          {typeof meal.difficulty === "number" && meal.difficulty > 0 && (
            <span className="hidden text-xs text-muted sm:inline">
              {"★".repeat(meal.difficulty)}
            </span>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-3 border border-border/50 bg-background/50 p-2.5 sm:p-3">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted sm:text-xs">
          食材
        </p>
        <div className="flex flex-wrap gap-1.5">
          {meal.ingredients.map((ing, i) => (
            <span
              key={i}
              className="inline-block max-w-full whitespace-normal break-all rounded-lg border border-border px-2 py-0.5 text-[11px] leading-snug text-foreground sm:rounded-full sm:text-xs"
            >
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted sm:text-xs">
          做法
        </p>
        <ol className="space-y-1.5">
          {meal.steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-2 text-[13px] leading-relaxed text-foreground/80 sm:text-xs"
            >
              <span className="shrink-0 font-bold text-accent tabular-nums">
                {i + 1}.
              </span>
              <span className="min-w-0 flex-1 break-words">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Source link */}
      {meal.sourceUrl && (
        <div className="mt-3 border-t border-border/30 pt-2">
          <a
            href={meal.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-muted transition-colors hover:text-accent"
          >
            ↗ 完整做法 · HowToCook
          </a>
        </div>
      )}
    </motion.div>
  );
}
