"use client";

import { useLocale } from "@/components/locale-provider";

export function BackLink() {
  const { dict } = useLocale();
  return (
    <a href="/blog" className="text-sm font-semibold text-white/60 transition-colors hover:text-white">
      {dict.blog.backToAll}
    </a>
  );
}
