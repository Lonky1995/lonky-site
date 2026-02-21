"use client";

import { useEffect, useRef } from "react";
import { ImageZoom } from "@/components/ui/ImageZoom";

/**
 * Wraps Velite-rendered HTML and converts <code>[MM:SS]</code> elements
 * into clickable timestamp buttons that dispatch podcast-seek events.
 */
export function TimestampContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all <code> elements that contain a timestamp pattern
    const codeEls = container.querySelectorAll("code");
    codeEls.forEach((code) => {
      const match = code.textContent?.match(/^\[(\d{1,2}):(\d{2})\]$/);
      if (!match) return;

      const mm = parseInt(match[1], 10);
      const ss = parseInt(match[2], 10);
      const seconds = mm * 60 + ss;
      const timeText = `${match[1]}:${match[2]}`;

      const btn = document.createElement("button");
      btn.textContent = timeText;
      btn.className =
        "inline-flex items-center gap-0.5 rounded bg-accent/10 px-1.5 py-0.5 text-xs font-mono text-accent hover:bg-accent/20 transition-colors cursor-pointer";
      btn.addEventListener("click", () => {
        document.dispatchEvent(
          new CustomEvent("podcast-seek", { detail: seconds })
        );
      });

      code.replaceWith(btn);
    });
  }, [html]);

  return (
    <div ref={containerRef}>
      <ImageZoom html={html} className={className} />
    </div>
  );
}
