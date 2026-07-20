"use client";

import { siteConfig } from "@/data/site-config";
import { useLocale } from "@/components/locale-provider";

export function ContactCTA() {
  const { dict, locale } = useLocale();

  return (
    <section className="apple-width">
      <div className="apple-cta" data-reveal>
        <p className="apple-eyebrow">{locale === "zh" ? "联系" : "Contact"}</p>
        <h2>{dict.contact.title}</h2>
        <p>{dict.contact.subtitle}</p>
        <div className="apple-hero-actions">
          <a
            href={siteConfig.socials.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button"
          >
            {locale === "zh" ? "在 X 上找我" : "Find me on X"}
          </a>
          <a
            href={siteConfig.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="secondary-button"
          >
            GitHub
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
