"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/data/site-config";

const socialIcons: Record<string, string> = {
  github: "GitHub",
  twitter: "Twitter",
  telegram: "Telegram",
  email: "Email",
};

export function ContactCTA() {
  return (
    <section id="about" className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 text-3xl font-bold md:text-4xl"
        >
          <span className="gradient-text">Let&apos;s Connect</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-muted"
        >
          Always open to interesting conversations and collaborations.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {Object.entries(siteConfig.socials).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target={key === "email" ? undefined : "_blank"}
              rel={key === "email" ? undefined : "noopener noreferrer"}
              className="rounded-full border border-border px-6 py-3 text-sm text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-foreground"
            >
              {socialIcons[key] || key}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
