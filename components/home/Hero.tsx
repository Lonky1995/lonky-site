"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useLocale } from "@/components/locale-provider";
import { projects } from "@/data/projects";

const TERMINAL_LINES = [
  { type: "cmd", text: "$ 我是谁" },
  { type: "out", key: "姓名", val: "Lonky" },
  { type: "out", key: "身份", val: "产品经理 → Vibecoder" },
  { type: "out", key: "技术栈", val: "Next.js · AI · Crypto" },
  { type: "out", key: "经验", val: "8 年产品经历" },
  { type: "blank" },
  { type: "cmd", text: "$ ls 作品/" },
];

function TerminalWindow({ started }: { started: boolean }) {
  const featured = projects.filter((p) => p.featured);
  const projectNames = featured.map((p) => p.title.zh).join("  ");

  const allLines = [
    ...TERMINAL_LINES,
    { type: "files", text: projectNames },
    { type: "blank" },
    { type: "cmd", text: "$ git log --oneline" },
    { type: "out", key: "a3f2b1", val: "· 2025 · OKX 产品经理" },
    { type: "out", key: "7cd5e6", val: "· 2024 · BingX 产品经理" },
    { type: "cursor" },
  ];

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    // delay start until after name typewriter (~1.4s)
    const startDelay = setTimeout(() => {
      let i = 0;
      const timer = setInterval(() => {
        i++;
        setVisibleCount(i);
        if (i >= allLines.length) clearInterval(timer);
      }, 110);
      return () => clearInterval(timer);
    }, 1400);
    return () => clearTimeout(startDelay);
  }, [started, allLines.length]);

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="dot dot-red" />
        <span className="dot dot-yellow" />
        <span className="dot dot-green" />
        <span className="terminal-title">lonky — zsh</span>
      </div>
      <div className="terminal-body">
        {allLines.map((line, i) => {
          if (i >= visibleCount) return null;
          if (line.type === "blank") return <div key={i} style={{ height: 8 }} />;
          if (line.type === "cmd") return (
            <div key={i} className="term-line">
              <span className="term-prompt">~</span>
              <span className="term-cmd">{line.text}</span>
            </div>
          );
          if (line.type === "files") return (
            <div key={i} className="term-line">
              <span className="term-files">{line.text}</span>
            </div>
          );
          if (line.type === "cursor") return (
            <div key={i} className="term-line">
              <span className="term-prompt">~</span>
              <span className="term-cmd">$ <span className="term-cursor">▋</span></span>
            </div>
          );
          return (
            <div key={i} className="term-line">
              <span className="term-key">{line.key}</span>
              <span className="term-val">{line.val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypewriterName({ onDone }: { onDone: () => void }) {
  const full = "Lonky";
  const [count, setCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    if (count >= full.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(() => {
          setShowCursor(false);
          onDone();
        }, 200);
      }
      return;
    }
    const t = setTimeout(() => setCount((c) => c + 1), 220);
    return () => clearTimeout(t);
  }, [count, full.length, onDone]);

  const plain = full.slice(0, count).replace(/ky$/, "");
  const em = full.slice(0, count).includes("k")
    ? full.slice(0, count).slice(plain.length)
    : "";

  return (
    <>
      {plain}
      {em && <em style={{ color: "var(--color-accent)", fontStyle: "italic" }}>{em}</em>}
      {showCursor && (
        <span className="name-cursor">|</span>
      )}
    </>
  );
}

export function Hero() {
  const { dict } = useLocale();
  const [terminalStarted, setTerminalStarted] = useState(false);

  return (
    <section className="hero-section">
      {/* Left: Editorial */}
      <motion.div
        className="hero-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {dict.hero.roles.join(" · ")}
        </motion.div>

        <motion.h1
          className="hero-name"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <TypewriterName onDone={() => setTerminalStarted(true)} />
        </motion.h1>

        <motion.p
          className="hero-desc"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {dict.hero.description.split("\n").map((line, i) => (
            <span key={i}>{i > 0 && <br />}{line}</span>
          ))}
        </motion.p>

        <motion.div
          className="hero-tags"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {["AI", "Crypto", "Product", "Vibecoding"].map((tag) => (
            <span key={tag} className="hero-tag">{tag}</span>
          ))}
        </motion.div>
      </motion.div>

      {/* Right: Terminal */}
      <motion.div
        className="hero-right"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <TerminalWindow started={terminalStarted} />

        <div className="hero-stats">
          {[
            { num: "8年", label: "产品经验" },
            { num: "5+", label: "上线项目" },
            { num: "0→1", label: "零代码基础" },
          ].map((s) => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-num">{s.num}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
