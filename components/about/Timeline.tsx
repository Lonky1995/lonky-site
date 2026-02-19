"use client";

import { motion } from "framer-motion";
import type { Experience } from "@/data/experience";
import { useLocale } from "@/components/locale-provider";

export function Timeline({ items }: { items: Experience[] }) {
  const { locale } = useLocale();

  return (
    <div className="relative border-l border-border pl-8">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.15 }}
          className="relative mb-12 last:mb-0"
        >
          {/* Dot */}
          <div className="absolute -left-[2.55rem] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-background" />

          <span className="mb-1 inline-block text-sm font-medium text-accent">
            {item.period[locale]}
          </span>
          <h3 className="mb-1 text-lg font-bold">
            {item.title[locale]}
            {item.company && (
              <span className="font-normal text-muted">
                {" "}
                @ {item.company}
              </span>
            )}
          </h3>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            {item.description[locale]}
          </p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
