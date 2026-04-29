"use client";

import { siteConfig } from "@/data/site-config";
import { useLocale } from "@/components/locale-provider";

export function Footer() {
  const { dict } = useLocale();

  return (
    <footer className="border-t border-border/30 px-6 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <p className="font-mono text-xs text-muted opacity-40">
          {siteConfig.name} © {new Date().getFullYear()}
        </p>
        <a
          href={siteConfig.socials.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-border/30 px-4 py-2 font-mono text-xs text-muted transition-all hover:border-accent hover:text-accent"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          @ImLonky
        </a>
      </div>
    </footer>
  );
}
