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
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-none border-2 border-foreground bg-card p-6 transition-colors hover:bg-card-hover hover:border-accent active:scale-[0.98] ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
