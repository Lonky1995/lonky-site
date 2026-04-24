"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const MESSAGES = [
  // 日常关怀
  "今天也要好好吃饭哦",
  "最近睡得好吗，记得午休",
  "带娃辛苦了，晚上早点睡",
  "肩膀还酸吗，回家给你捏捏",
  "天气凉了，多穿一件",
  "想吃什么告诉我，我给你做",
  "别总惦记宝宝，也照顾下自己",
  "喝口水吧，别光顾着忙",
  // 小情话
  "今天也很想你",
  "和你在一起的每一天都好",
  "你笑起来的样子最好看",
  "下班就回家，不加班",
  "娶到你是我最对的决定",
  "谢谢你把家经营得这么好",
  // 生活小幽默
  "别催了，菜马上就好",
  "今天我做饭，你歇着",
  "宝宝随你，所以这么可爱",
  // 家庭温馨
  "双胞胎又长大了一点呢",
  "等娃睡了，我们一起看部电影",
];

const LOADING_TIPS = [
  "为你精心挑选今日菜谱...",
  "搭配全家营养均衡的一餐...",
  "为宝宝改造软烂安全版本...",
  "快好了，再等一小下...",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function CookingAnimation() {
  // 每次加载时打乱一次顺序，避免每次都从第一条开始
  const queue = useMemo(() => shuffle(MESSAGES), []);
  const [idx, setIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % queue.length);
    }, 3000);
    return () => clearInterval(t);
  }, [queue.length]);

  useEffect(() => {
    const t = setInterval(() => {
      setTipIdx((i) => (i + 1) % LOADING_TIPS.length);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden py-10 sm:py-14">
      {/* 浅米色背景晕染 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(244,240,230,1) 0%, rgba(240,233,218,0.5) 55%, transparent 100%)",
        }}
      />

      {/* 信纸卡片 */}
      <div className="relative w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16, rotate: -0.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -16, rotate: 0.5 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto aspect-[4/3] w-full"
          >
            {/* 纸张本体 */}
            <div
              className="absolute inset-0 flex items-center justify-center px-8 py-10 sm:px-10 sm:py-12"
              style={{
                background:
                  "linear-gradient(135deg, #FBF7EC 0%, #F4EEDC 100%)",
                boxShadow:
                  "0 12px 30px -10px rgba(0,0,0,0.18), 0 2px 6px -2px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(184,52,46,0.08)",
              }}
            >
              {/* 横格线（模拟信纸） */}
              <div
                className="pointer-events-none absolute inset-x-8 bottom-6 top-6 opacity-30"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(26,26,26,0.12) 31px 32px)",
                }}
              />
              {/* 左边红线（信纸 margin） */}
              <div
                className="pointer-events-none absolute left-6 top-4 bottom-4 w-px opacity-40"
                style={{ background: "rgba(184,52,46,0.5)" }}
              />

              {/* 文案 */}
              <p
                className="relative z-10 text-center text-lg leading-relaxed text-foreground sm:text-xl"
                style={{
                  fontFamily:
                    "'STKaiti','Kaiti SC','KaiTi','BiauKai','DFKai-SB', serif",
                  letterSpacing: "0.05em",
                }}
              >
                {queue[idx]}
              </p>

              {/* 右下角小红心 */}
              <motion.span
                className="absolute bottom-4 right-5 text-base sm:text-lg"
                style={{ color: "#B8342E", fontFamily: "serif" }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ♥
              </motion.span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 下方 loading 提示 */}
      <div className="relative mt-8 h-5 w-full sm:mt-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIdx}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-x-0 text-center text-xs text-muted sm:text-sm"
          >
            {LOADING_TIPS[tipIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 三个跳动的点 */}
      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#1A1A1A" }}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
