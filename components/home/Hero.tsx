"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

const roles = ["Product Thinker", "AI Builder"];

const navCards = [
  {
    emoji: "🚀",
    title: "Projects",
    count: 3,
    description: "AI 工具、加密货币平台、开发者工具",
    href: "#projects",
  },
  {
    emoji: "✍️",
    title: "Blog",
    description: "产品思考、技术实践、构建记录",
    href: "#blog",
  },
  {
    emoji: "👤",
    title: "About",
    description: "PM 转型 Builder 的旅程",
    href: "#about",
  },
];

export function Hero() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentRole = roles[roleIndex];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && text === currentRole) {
      const timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && text === "") {
      setIsDeleting(false);
      setRoleIndex((prev) => (prev + 1) % roles.length);
      return;
    }

    const timeout = setTimeout(() => {
      setText(
        isDeleting
          ? currentRole.slice(0, text.length - 1)
          : currentRole.slice(0, text.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, roleIndex]);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6">
      <ParticleBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Left: Copy */}
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Hey, I&apos;m <span className="gradient-text">Lonky</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-6 h-8 text-lg text-muted md:text-xl"
          >
            <span>{text}</span>
            <span className="animate-pulse text-accent">|</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-md text-muted leading-relaxed"
          >
            欢迎来到我的 digital garden。
            <br />
            这里记录我从产品经理转型为 AI Builder 的所有探索——
            <br />
            项目、文章、和一路走来的思考。
          </motion.p>
        </div>

        {/* Right: Navigation Cards */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col gap-4 lg:w-80"
        >
          {navCards.map((card, i) => (
            <motion.a
              key={card.title}
              href={card.href}
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector(card.href)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
              whileHover={{ y: -4 }}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:bg-card-hover"
            >
              {/* Gradient border glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-br from-accent via-accent-light to-cyan opacity-20" />
              </div>
              <div className="relative z-10 flex items-start gap-3">
                <span className="text-2xl">{card.emoji}</span>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {card.title}
                    {card.count != null && (
                      <span className="ml-2 text-sm font-normal text-muted">
                        ({card.count})
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{card.description}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
