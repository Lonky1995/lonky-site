"use client";

import { useEffect } from "react";

/** IntersectionObserver for [data-reveal] — fails open (content stays visible). */
export function RevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const revealAll = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.classList.add("is-visible");
      });
    };

    // Enable hide-until-visible only after we can observe
    document.documentElement.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );

    const observePending = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)")
        .forEach((el) => observer.observe(el));
    };

    // First paint: reveal anything already in viewport
    observePending();
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
          el.classList.add("is-visible");
        }
      });
      observePending();
    });

    // Safety net: never leave content invisible
    const safety = window.setTimeout(() => revealAll(), 1200);

    const mo = new MutationObserver(() => observePending());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(safety);
      observer.disconnect();
      mo.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return <>{children}</>;
}
