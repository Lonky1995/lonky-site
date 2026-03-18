"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { CosmicOrb } from "@/components/ui/CosmicOrb";
import { useLocale } from "@/components/locale-provider";

export function Hero() {
  const { dict } = useLocale();
  const roles = dict.hero.roles;

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
  }, [text, isDeleting, roleIndex, roles]);

  return (
    <section className="relative z-10 flex min-h-screen items-center overflow-hidden px-6 md:px-12 lg:px-20">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Greeting line */}
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 text-sm font-medium tracking-[0.2em] uppercase text-accent/70"
        >
          {dict.hero.greeting}
        </motion.p>

        {/* MASSIVE name */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 font-bold leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(4rem, 16vw, 12rem)" }}
        >
          <span style={{
            background: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 50%, #22d3ee 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(59,130,246,0.65)) drop-shadow(0 0 90px rgba(59,130,246,0.35))",
          }}>Lonky</span>
        </motion.h1>

        {/* Role typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="h-px w-12 bg-accent/40" />
          <span className="text-lg text-muted md:text-xl font-light tracking-wide">
            {text}
            <span className="animate-pulse text-accent ml-0.5">|</span>
          </span>
        </motion.div>

        {/* Description + Orb row */}
        <div className="flex items-end justify-between gap-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-sm text-muted leading-relaxed text-base"
          >
            {dict.hero.description.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </motion.p>

          {/* Orb — right side, only on large screens */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block flex-shrink-0"
          >
            <CosmicOrb />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
