"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { RocketLaunch } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";

function OkxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="rounded flex-shrink-0">
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
  return (
    <Image src={src} alt={alt} width={18} height={18} className="rounded flex-shrink-0" />
  );
}

type Entry = { year: string; msg: ReactNode };

const entries: Entry[] = [
  {
    year: "2025",
    msg: (
      <span className="flex items-center gap-2">
        <OkxIcon /> OKX，产品经理
      </span>
    ),
  },
  {
    year: "2024",
    msg: (
      <span className="flex items-center gap-2">
        <Logo src="/images/logos/bingx.jpeg" alt="BingX" /> BingX，产品经理
      </span>
    ),
  },
  {
    year: "2023",
    msg: (
      <span className="flex items-center gap-2">
        <Logo src="/images/logos/followin.png" alt="Followin" /> 联合创办 Followin
      </span>
    ),
  },
  {
    year: "2020–23",
    msg: (
      <span className="flex items-center gap-2">
        <span className="flex gap-1">
          <Logo src="/images/logos/weread.jpeg" alt="WeRead" />
          <Logo src="/images/logos/wechat-listen.jpeg" alt="WeChat Listen" />
          <Logo src="/images/logos/miniprogram.png" alt="Mini Program" />
        </span>
        腾讯微信产品经理
      </span>
    ),
  },
  {
    year: "2018",
    msg: (
      <span className="flex items-center gap-2">
        <RocketLaunch size={18} weight="duotone" className="flex-shrink-0 opacity-80" />
        创办 Token Galaxy
      </span>
    ),
  },
];

export function AboutTimeline() {
  const { dict, locale } = useLocale();

  return (
    <section className="apple-width apple-section" id="about">
      <div className="apple-section-head" data-reveal>
        <p className="apple-eyebrow">{locale === "zh" ? "经历" : "Path"}</p>
        <h2 className="apple-section-title">{dict.aboutTimeline.title}</h2>
        <p className="apple-muted">{dict.aboutTimeline.subtitle}</p>
      </div>

      <div className="apple-timeline">
        {entries.map((e, i) => (
          <div
            key={e.year}
            className="apple-timeline-item"
            data-reveal
            style={{ ["--delay" as string]: `${i * 70}ms` }}
          >
            <div className="apple-timeline-year">{e.year}</div>
            <div className="apple-timeline-msg">{e.msg}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
