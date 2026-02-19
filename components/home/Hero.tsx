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
    <section className="relative z-10 flex min-h-screen items-center overflow-hidden px-6">
      <ParticleBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-16">
        {/* Left: Copy */}
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            {dict.hero.greeting}{" "}
            <span className="gradient-text">Lonky</span>
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
            {dict.hero.description.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </motion.p>
        </div>

        {/* Right: Cosmic Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <CosmicOrb />
        </motion.div>
      </div>
    </section>
  );
}
