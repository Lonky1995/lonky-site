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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <h2
              className="font-bold leading-[0.88] tracking-tight text-foreground uppercase"
              style={{ fontSize: "clamp(2.8rem, 8vw, 6rem)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-5 text-base text-muted font-light max-w-xl leading-relaxed">{subtitle}</p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
