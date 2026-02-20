"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";

interface WechatArticle {
  title: string;
  content: string;
  author: string;
  url: string;
  updated_at: string;
}

export function ContactCTA({ tweetSlot, wechatArticle }: { tweetSlot?: ReactNode; wechatArticle?: WechatArticle }) {
  const { dict } = useLocale();
  const { contact: t } = dict;

  const channels = [
    {
      key: "github",
      label: "GitHub",
      href: "https://github.com/Lonky1995",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    {
      key: "wechat",
      label: "WeChat : Lonkyday",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.329 6.329 0 0 1-.235-1.69c0-3.65 3.387-6.611 7.565-6.611.324 0 .639.025.95.06C17.1 4.505 13.273 2.188 8.69 2.188zm7.645 8.16c4.142 0 7.502 2.834 7.502 6.329 0 1.947-1.07 3.678-2.745 4.848a.537.537 0 0 0-.197.605l.264 1.004a.443.443 0 0 1 .017.152.26.26 0 0 1-.256.256.288.288 0 0 0-.148-.048l-1.375-.803a.758.758 0 0 0-.63-.086 8.86 8.86 0 0 0 2.432-.354c-4.143 0-7.502-2.833-7.502-6.328 0-.205.011-.407.032-.607-.01.203-.032.403-.032.607 0 3.495 3.36 6.328 7.502 6.328z" />
        </svg>
      ),
      action: "copy" as const,
      copyValue: "Lonkyday",
    },
  ];

  return (
    <section id="about" className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            <span className="gradient-text">{t.title}</span>
          </h2>
          <p className="text-muted">{t.subtitle}</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left: Latest Tweet */}
          {tweetSlot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex h-full flex-col"
            >
              <p className="mb-3 text-sm font-medium text-muted">
                {t.latestOnX}
              </p>
              <div data-theme="dark" className="min-h-0 flex-1 overflow-hidden [&>div]:h-full [&_article]:h-full">
                {tweetSlot}
              </div>
            </motion.div>
          )}

          {/* Right: Social Channels + 公众号 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex h-full flex-col gap-4"
          >
            <p className="text-sm font-medium text-muted">{t.findMeOn}</p>

            {channels.map((ch) =>
              ch.action === "copy" ? (
                <button
                  key={ch.key}
                  onClick={() => {
                    navigator.clipboard.writeText(ch.copyValue!);
                    alert(`${t.wechatCopied} ${ch.copyValue}`);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-left text-sm text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-foreground"
                >
                  {ch.icon}
                  {ch.label}
                </button>
              ) : (
                <a
                  key={ch.key}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-foreground"
                >
                  {ch.icon}
                  {ch.label}
                </a>
              )
            )}

            {/* 公众号 Latest Article */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-sm text-muted">
                {t.officialAccount}
              </p>
              {wechatArticle ? (
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    {wechatArticle.title}
                  </h3>
                  <p className="text-sm text-muted line-clamp-3">
                    {wechatArticle.content}
                  </p>
                  <p className="text-xs text-muted/60 mt-3">
                    @{wechatArticle.author} · {wechatArticle.updated_at}
                  </p>
                  <p className="text-xs text-muted/50 mt-1">
                    微信搜索「{wechatArticle.author}」阅读全文
                  </p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Image
                    src="/images/wechat-mp-qr.jpg"
                    alt={t.officialAccountAlt}
                    width={160}
                    height={160}
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
