"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { RocketLaunch } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";

function OkxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className="rounded flex-shrink-0">
      <rect width="24" height="24" rx="4" fill="#000" />
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#fff" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#fff" />
    </svg>
  );
}

function Logo({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={20} height={20} className="rounded flex-shrink-0" />;
}

type Entry = { hash: string; year: string; msg: ReactNode };

const entries: Entry[] = [
  {
    hash: "a3f2b1c",
    year: "2025 至今",
    msg: <span className="flex items-center gap-2"><OkxIcon /> feat: 加入 OKX，负责产品</span>,
  },
  {
    hash: "7cd5e69",
    year: "2024 - 2025",
    msg: <span className="flex items-center gap-2"><Logo src="/images/logos/bingx.jpeg" alt="BingX" /> feat: 加入 BingX，负责产品</span>,
  },
  {
    hash: "23e2444",
    year: "2023 - 2024",
    msg: <span className="flex items-center gap-2"><Logo src="/images/logos/followin.png" alt="Followin" /> feat: 联合创办 Followin，产品负责人</span>,
  },
  {
    hash: "89f2836",
    year: "2020 - 2023",
    msg: (
      <span className="flex items-center gap-2">
        <span className="flex gap-1">
          <Logo src="/images/logos/weread.jpeg" alt="WeRead" />
          <Logo src="/images/logos/wechat-listen.jpeg" alt="WeChat Listen" />
          <Logo src="/images/logos/miniprogram.png" alt="Mini Program" />
        </span>
        feat: 腾讯微信产品经理（微信读书 · 听书 · 小程序）
      </span>
    ),
  },
  {
    hash: "7875369",
    year: "2018",
    msg: <span className="flex items-center gap-2"><RocketLaunch size={20} weight="duotone" className="text-accent-light flex-shrink-0" /> init: 创办 Token Galaxy</span>,
  },
];

export function AboutTimeline() {
  const { dict } = useLocale();

  return (
    <section className="git-section">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="git-header-line"
        >
          $ git log --format=&quot;%h · %ar · %s&quot;
        </motion.div>

        <div className="git-log">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.hash}
              className="git-entry"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="git-hash">{entry.hash}</span>
              <span className="git-year">{entry.year}</span>
              <div className="git-msg">{entry.msg}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
