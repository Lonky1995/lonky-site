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
      className="border-2 border-foreground bg-card p-5"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-foreground">{meal.name}</h3>
          {meal.basedOn && (
            <p className="mt-0.5 text-xs text-muted">改自：{meal.basedOn}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs font-medium text-accent">{meal.category}</span>
          {meal.nutrition && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
              {meal.nutrition}
            </span>
          )}
          {typeof meal.difficulty === "number" && meal.difficulty > 0 && (
            <span className="text-xs text-muted">{"★".repeat(meal.difficulty)}</span>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-3 border border-border/50 bg-background/50 p-3">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">食材</p>
        <div className="flex flex-wrap gap-1.5">
          {meal.ingredients.map((ing, i) => (
            <span key={i} className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">做法</p>
        <ol className="space-y-1">
          {meal.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-foreground/80 leading-relaxed">
              <span className="shrink-0 font-bold text-accent">{i + 1}.</span>
              <span>{step}</span>
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
            className="text-xs text-muted transition-colors hover:text-accent"
          >
            ↗ 完整做法 · HowToCook
          </a>
        </div>
      )}
    </motion.div>
  );
}
