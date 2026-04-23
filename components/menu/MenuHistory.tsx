"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { listMenus, deleteMenu, type MenuRecord } from "@/lib/menu/storage";
import { ShareImage } from "./ShareImage";

export function MenuHistory() {
  const [records, setRecords] = useState<MenuRecord[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<MenuRecord | null>(null);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecords(listMenus());
  }, []);

  function handleDelete(date: string) {
    if (!confirm("确认删除这条菜谱记录？")) return;
    deleteMenu(date);
    setRecords(listMenus());
    if (expanded === date) setExpanded(null);
  }

  async function handleShare(record: MenuRecord) {
    setShareTarget(record);
    // 等一帧确保离屏节点渲染
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 50));
    if (!shareRef.current) {
      setShareTarget(null);
      return;
    }
    setSharing(true);
    try {
      const dataUrl = await toPng(shareRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#F4F0E6",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `菜谱-${record.date}.png`, {
        type: "image/png",
      });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "陈绚妮家的今日菜谱",
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `菜谱-${record.date}.png`;
        a.click();
      }
    } catch {
      // ignore
    } finally {
      setSharing(false);
      setShareTarget(null);
    }
  }

  if (records === null) {
    return <p className="text-sm text-muted">加载中...</p>;
  }

  if (records.length === 0) {
    return (
      <div className="border-2 border-dashed border-foreground/20 p-16 text-center">
        <p className="text-sm text-muted">还没有保存的菜谱</p>
        <Link
          href="/menu"
          className="mt-4 inline-block text-sm text-accent underline underline-offset-2"
        >
          去生成第一份菜谱 →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {records.map((r) => {
          const isOpen = expanded === r.date;
          return (
            <div
              key={r.date}
              className="border-2 border-foreground bg-card"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : r.date)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent/5 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold sm:text-base">
                    {r.dateLabel}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted sm:text-sm">
                    {r.adult.map((m) => m.name).join(" · ")}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {isOpen ? "收起" : "展开"}
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t-2 border-foreground"
                  >
                    <div className="space-y-4 p-4 sm:p-5">
                      <Group title="大人" meals={r.adult} />
                      <Group title="宝宝" meals={r.baby} accent />

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleShare(r)}
                          disabled={sharing}
                          className="flex-1 border-2 border-accent bg-accent/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent transition-all hover:bg-accent/10 disabled:opacity-50 sm:text-sm"
                        >
                          {sharing && shareTarget?.date === r.date
                            ? "生成中..."
                            : "分享为图片"}
                        </button>
                        <button
                          onClick={() => handleDelete(r.date)}
                          className="border-2 border-foreground/30 px-4 py-2 text-xs text-muted transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 离屏分享图 */}
      {shareTarget && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <ShareImage ref={shareRef} record={shareTarget} />
        </div>
      )}
    </>
  );
}

function Group({
  title,
  meals,
  accent,
}: {
  title: string;
  meals: MenuRecord["adult"] | MenuRecord["baby"];
  accent?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`border-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${
            accent
              ? "border-accent bg-accent/5 text-accent"
              : "border-foreground"
          }`}
        >
          {title}
        </span>
      </div>
      <ul className="space-y-1 text-sm">
        {meals.map((m, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="font-medium">{m.name}</span>
            <span
              className={`shrink-0 text-xs ${
                accent ? "text-accent" : "text-muted"
              }`}
            >
              {m.category}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
