"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";

/* ── OKX inline SVG (5-square cross pattern) ── */
function OkxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="rounded">
      <rect width="24" height="24" rx="4" fill="#000" />
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#fff" />
    </svg>
  );
}

/* ── Logo image helper ── */
function Logo({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className="rounded"
    />
  );
}

/* ── Timeline Data (static structure, text from dict) ── */
type TimelineEntry = {
  year: string;
  icons: ReactNode;
  title: string;
  role: string;
  link?: { href: string };
};

const timelineStructure: TimelineEntry[] = [
  {
    year: "2025 - Now",
    icons: <OkxIcon />,
    title: "OKX",
    role: "Product Manager",
  },
  {
    year: "2024 - 2025",
    icons: <Logo src="/images/logos/bingx.jpeg" alt="BingX" />,
    title: "BingX",
    role: "Product Manager",
  },
  {
    year: "2023 - 2024",
    icons: <Logo src="/images/logos/followin.svg" alt="Followin" />,
    title: "Followin",
    role: "Product Co-founder",
  },
  {
    year: "2020 - 2023",
    icons: (
      <span className="flex gap-1.5">
        <Logo src="/images/logos/weread.jpeg" alt="WeRead" />
        <Logo src="/images/logos/wechat-listen.jpeg" alt="WeChat Listen" />
        <Logo src="/images/logos/miniprogram.png" alt="Mini Program" />
      </span>
    ),
    title: "Tencent · WeChat",
    role: "Product Manager",
  },
  {
    year: "2018",
    icons: <span className="text-xl leading-none">🚀</span>,
    title: "Token Galaxy",
    role: "Founder",
    link: {
      href: "https://www.youtube.com/results?search_query=token+galaxy+2018",
    },
  },
];

/* ── Component ── */

export function AboutTimeline() {
  const { dict } = useLocale();
  const { aboutTimeline: t } = dict;

  return (
    <section id="about-me" className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold md:text-4xl">
            <span className="gradient-text">{t.title}</span>
          </h2>
          <p className="mt-3 text-lg text-muted">{t.subtitle}</p>
        </motion.div>

        <div className="relative ml-4 border-l border-border pl-8">
          {timelineStructure.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative mb-10 last:mb-0"
            >
              {/* Dot */}
              <div className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-background" />

              <span className="text-xs font-medium text-accent">
                {item.year}
              </span>
              <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                <span className="flex-shrink-0">{item.icons}</span>
                {item.title}
                <span className="text-sm font-normal text-muted">
                  {item.role}
                </span>
              </h3>
              {item.link && (
                <a
                  href={item.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block text-sm text-accent transition-colors hover:text-accent-light"
                >
                  {t.viewLink}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
