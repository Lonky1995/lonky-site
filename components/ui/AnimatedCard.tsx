"use client";

import { motion } from "framer-motion";

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:bg-card-hover ${className}`}
    >
      {/* Gradient border glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-br from-accent via-accent-light to-cyan opacity-20" />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
