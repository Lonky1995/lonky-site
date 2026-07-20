"use client";

import { siteConfig } from "@/data/site-config";

export function Footer() {
  return (
    <footer className="apple-footer">
      <p>
        {siteConfig.name} © {new Date().getFullYear()}
      </p>
      <div className="flex items-center gap-4">
        <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={siteConfig.socials.twitter} target="_blank" rel="noopener noreferrer">
          X
        </a>
      </div>
    </footer>
  );
}
