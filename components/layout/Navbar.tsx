"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

const links = [
  { href: "/", key: "home" as const },
  { href: "/projects", key: "projects" as const },
  { href: "/blog", key: "blog" as const },
  { href: "/portfolio", key: "portfolio" as const, fallback: "组合" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dict, setLocale, locale } = useLocale();

  const hideNavbar =
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname.startsWith("/sign-up/");

  if (hideNavbar) return null;

  const labelFor = (key: (typeof links)[number]["key"], fallback?: string) => {
    if (key === "portfolio") return fallback ?? "组合";
    return dict.nav[key] ?? fallback ?? key;
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="apple-nav">
        <Link href="/" className="apple-nav-mark">
          <span className="apple-nav-dot" aria-hidden />
          lonky
        </Link>

        <nav className="apple-nav-links" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? "is-active" : undefined}
            >
              {labelFor(l.key, l.fallback)}
            </Link>
          ))}
        </nav>

        <div className="apple-nav-actions">
          <button
            type="button"
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="apple-nav-lang"
          >
            {dict.common.langSwitch}
          </button>
          <Link href="/projects" className="apple-nav-cta">
            {locale === "zh" ? "作品" : "Work"}
          </Link>
          <button
            type="button"
            className="apple-nav-mobile-btn"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span
              style={{
                transform: mobileOpen ? "translateY(6.5px) rotate(45deg)" : undefined,
              }}
            />
            <span style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span
              style={{
                transform: mobileOpen ? "translateY(-6.5px) rotate(-45deg)" : undefined,
              }}
            />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="apple-nav-drawer">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? "is-active" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {labelFor(l.key, l.fallback)}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
