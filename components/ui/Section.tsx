"use client";

import { motion } from "framer-motion";

export function Section({
  children,
  title,
  subtitle,
  className = "",
  id,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-6 py-20 md:px-8 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              <span className="gradient-text">{title}</span>
            </h2>
            {subtitle && (
              <p className="mt-3 text-lg text-muted">{subtitle}</p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
