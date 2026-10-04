"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

const links = [
  { href: "/", key: "home" as const },
  { href: "/projects", key: "projects" as const },
  { href: "/crypto", key: "crypto" as const, fallback: "crypto" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dict, setLocale, locale } = useLocale();

  const editorial =
    pathname === "/" ||
    pathname === "/projects" ||
    pathname.startsWith("/blog") ||
    (pathname.startsWith("/podcast-notes/") &&
      pathname !== "/podcast-notes/new");

  const hideNavbar =
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname.startsWith("/sign-up/");

  if (hideNavbar || pathname === "/") return null;

  const labelFor = (key: (typeof links)[number]["key"], fallback?: string) => {
    if (key === "crypto") return "Crypto";
    if (editorial && key === "projects")
      return locale === "zh" ? "作品" : "Work";
    return dict.nav[key] ?? fallback ?? key;
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`apple-nav ${editorial ? "mf-nav" : ""}`}
        data-site-theme={editorial ? "editorial" : "dashboard"}
      >
        <Link href="/" className="apple-nav-mark">
          {editorial ? (
            <span className="mf-nav-star" aria-hidden>
              ✳︎
            </span>
          ) : (
            <span className="apple-nav-dot" aria-hidden />
          )}
          Lonky
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
          <Link
            href={editorial ? "/#contact" : "/projects"}
            className="apple-nav-cta"
          >
            {editorial
              ? locale === "zh"
                ? "聊聊新想法"
                : "Say hello"
              : locale === "zh"
                ? "作品"
                : "Work"}
          </Link>
          <button
            type="button"
            className="apple-nav-mobile-btn"
            aria-label={locale === "zh" ? "切换菜单" : "Toggle menu"}
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span
              style={{
                transform: mobileOpen
                  ? "translateY(6.5px) rotate(45deg)"
                  : undefined,
              }}
            />
            <span style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span
              style={{
                transform: mobileOpen
                  ? "translateY(-6.5px) rotate(-45deg)"
                  : undefined,
              }}
            />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className={`apple-nav-drawer ${editorial ? "mf-nav-drawer" : ""}`}
          id="site-mobile-menu"
        >
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
