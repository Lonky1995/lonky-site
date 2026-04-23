"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
  "为你精心挑选今日菜谱...",
  "搭配全家营养均衡的一餐...",
  "为宝宝改造软烂安全版本...",
  "快好了，再等一小下...",
];

const NAME = "陈绚妮";
const CHAR_DURATION = 1.6; // 每个字写多久
const TOTAL_WRITE = NAME.length * CHAR_DURATION;
const TOTAL_CYCLE = TOTAL_WRITE + 2.2; // 写完停留再循环

export function CookingAnimation() {
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIdx((i) => (i + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden py-12 sm:py-16">
      {/* 宣纸纹理背景 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(244,240,230,1) 0%, rgba(240,233,218,0.6) 50%, transparent 100%)",
        }}
      />
      {/* 淡墨晕染 */}
      <motion.div
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(26,26,26,0.04) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 书法主体 */}
      <div className="relative flex items-start gap-2 sm:gap-4">
        {/* 三个字 */}
        {NAME.split("").map((ch, i) => (
          <BrushChar
            key={i}
            char={ch}
            delay={i * CHAR_DURATION}
            cycle={TOTAL_CYCLE}
          />
        ))}

        {/* 红印章 */}
        <motion.div
          className="relative -ml-1 mt-10 sm:mt-14"
          initial={{ scale: 0, opacity: 0, rotate: -12 }}
          animate={{
            scale: [0, 0, 1.15, 1, 1, 0],
            opacity: [0, 0, 1, 1, 1, 0],
            rotate: [-12, -12, -3, -6, -6, -6],
          }}
          transition={{
            duration: TOTAL_CYCLE,
            times: [
              0,
              TOTAL_WRITE / TOTAL_CYCLE - 0.02,
              TOTAL_WRITE / TOTAL_CYCLE + 0.03,
              TOTAL_WRITE / TOTAL_CYCLE + 0.08,
              0.97,
              1,
            ],
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md border-2 text-base font-bold sm:h-12 sm:w-12 sm:text-lg"
            style={{
              borderColor: "#B8342E",
              color: "#B8342E",
              background: "rgba(184, 52, 46, 0.06)",
              boxShadow: "0 0 0 1px rgba(184, 52, 46, 0.2) inset",
              fontFamily: "serif",
            }}
          >
            ♥
          </div>
          {/* 印章墨迹不均匀的小点 */}
          <span
            className="pointer-events-none absolute top-1 right-1 h-1 w-1 rounded-full"
            style={{ background: "#B8342E", opacity: 0.7 }}
          />
          <span
            className="pointer-events-none absolute bottom-2 left-1 h-0.5 w-0.5 rounded-full"
            style={{ background: "#B8342E", opacity: 0.5 }}
          />
        </motion.div>
      </div>

      {/* 轮播文案 */}
      <div className="relative mt-10 h-6 w-full sm:mt-12">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIdx}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 text-center text-sm text-muted sm:text-base"
          >
            {MESSAGES[messageIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 三个跳动的点 */}
      <div className="mt-5 flex gap-1.5">
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

/** 单个字：墨迹从左到右晕开 + 笔尖墨点跟随 */
function BrushChar({
  char,
  delay,
  cycle,
}: {
  char: string;
  delay: number;
  cycle: number;
}) {
  // 每个字在整个循环中的时间占比
  const startPct = delay / cycle;
  const writePct = CHAR_DURATION / cycle;
  const endWritePct = startPct + writePct;

  return (
    <div className="relative">
      {/* 底层轮廓（未写的字，极淡） */}
      <motion.span
        className="block font-bold leading-none select-none"
        style={{
          fontSize: "clamp(3.5rem, 16vw, 6rem)",
          color: "rgba(26,26,26,0.08)",
          fontFamily:
            "'STKaiti','Kaiti SC','KaiTi','BiauKai','DFKai-SB', serif",
        }}
      >
        {char}
      </motion.span>

      {/* 上层：墨色字从左到右显现（用 clip-path 扫出） */}
      <motion.span
        className="absolute inset-0 block font-bold leading-none select-none"
        style={{
          fontSize: "clamp(3.5rem, 16vw, 6rem)",
          color: "#1A1A1A",
          fontFamily:
            "'STKaiti','Kaiti SC','KaiTi','BiauKai','DFKai-SB', serif",
          textShadow:
            "0 0 1px rgba(26,26,26,0.3), 0 0 2px rgba(26,26,26,0.15)",
        }}
        animate={{
          clipPath: [
            "inset(0 100% 0 0)",
            "inset(0 100% 0 0)",
            "inset(0 0% 0 0)",
            "inset(0 0% 0 0)",
            "inset(0 100% 0 0)",
          ],
        }}
        transition={{
          duration: cycle,
          times: [0, startPct, endWritePct, 0.97, 1],
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {char}
      </motion.span>

      {/* 笔尖墨点（跟着显现的"写头"移动） */}
      <motion.span
        className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, #1A1A1A 0%, rgba(26,26,26,0.4) 60%, transparent 100%)",
        }}
        animate={{
          left: ["0%", "0%", "100%", "100%", "0%"],
          opacity: [0, 1, 1, 0, 0],
        }}
        transition={{
          duration: cycle,
          times: [0, startPct, endWritePct, endWritePct + 0.01, 1],
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
