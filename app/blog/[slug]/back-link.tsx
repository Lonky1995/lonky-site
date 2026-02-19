"use client";

import { useLocale } from "@/components/locale-provider";

export function BackLink() {
  const { dict } = useLocale();
  return (
    <a
      href="/blog"
      className="text-sm text-muted transition-colors hover:text-foreground"
    >
      {dict.blog.backToAll}
    </a>
  );
}
