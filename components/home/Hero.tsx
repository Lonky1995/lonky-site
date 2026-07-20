"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { projects } from "@/data/projects";

export function Hero() {
  const { dict, locale } = useLocale();
  const featured = projects.find((p) => p.id === "lonkyclaw") ?? projects.find((p) => p.featured);
  const title = featured ? featured.title[locale] : "LonkyClaw";
  const desc = featured ? featured.description[locale] : "";
  const href = featured?.github ?? featured?.link ?? "/projects";
  const tech = featured?.techStack ?? [];

  return (
    <section className="apple-width apple-hero">
      <div className="hero-copy" data-reveal>
        <p className="apple-eyebrow">{dict.hero.roles.join(" · ")}</p>
        <h1 className="apple-hero-title">Lonky.</h1>
        <p className="apple-muted" style={{ marginTop: 24, maxWidth: "36ch", whiteSpace: "pre-line" }}>
          {dict.hero.description}
        </p>
        <div className="apple-hero-actions">
          <Link href="/projects" className="primary-button">
            {locale === "zh" ? "查看作品" : "View work"}
          </Link>
          <Link href="/blog" className="secondary-button">
            {locale === "zh" ? "阅读笔记" : "Read notes"}
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="apple-hero-tags">
          {["AI", "Crypto", "Product", "Vibecoding"].map((t) => (
            <span key={t} className="apple-tag">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="device-theater" data-reveal>
        <div className="device-aura" aria-hidden />
        <div className="floating-card floating-card-left">
          <strong>{locale === "zh" ? "8 年产品" : "8 yrs product"}</strong>
          {locale === "zh" ? "微信 → OKX" : "WeChat → OKX"}
        </div>
        <div className="product-panel">
          <div className="product-panel-badge">
            <span className="dot" />
            {featured?.status === "live" ? "Live" : "In progress"}
          </div>
          <h3>{title}</h3>
          <p>{desc}</p>
          <div className="product-panel-meta">
            {tech.slice(0, 4).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <a
            href={href}
            className="product-panel-link"
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {locale === "zh" ? "了解更多 →" : "Learn more →"}
          </a>
        </div>
        <div className="floating-card floating-card-right">
          <strong>Vibecoding</strong>
          {locale === "zh" ? "用 AI 把想法做成产品" : "Shipping with AI"}
        </div>
      </div>
    </section>
  );
}
