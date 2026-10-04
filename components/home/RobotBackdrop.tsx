"use client";

import { useEffect, useRef, useState } from "react";

const ROBOT_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4";

export function RobotBackdrop({ english }: { english: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const interactionEnabled = useRef(true);
  const [interactive, setInteractive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const media = video.current;
    const host = surface.current?.closest<HTMLElement>(".hero");
    if (!media || !host) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let target = 0;
    let previous: { x: number; y: number } | null = null;
    let raf = 0;
    let dragging = false;
    let interacting = true;
    const seek = () => {
      raf = 0;
      if (!interacting || media.seeking || !Number.isFinite(media.duration))
        return;
      if (Math.abs(media.currentTime - target) > 0.008)
        media.currentTime = target;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(seek);
    };
    const onSeeked = () => {
      if (interacting) schedule();
    };
    const onLoaded = () => {
      target = media.duration * 0.45;
      media.currentTime = target;
    };
    const onMove = (event: PointerEvent) => {
      if (
        !interactionEnabled.current ||
        preference.matches ||
        document.hidden ||
        (event.pointerType !== "mouse" && !dragging) ||
        !Number.isFinite(media.duration)
      )
        return;
      if ((event.target as Element).closest("a,button")) {
        previous = null;
        return;
      }
      if (!previous) {
        previous = { x: event.clientX, y: event.clientY };
        return;
      }
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      previous = { x: event.clientX, y: event.clientY };
      if (!interacting) target = media.currentTime;
      interacting = true;
      media.pause();
      const delta =
        event.pointerType === "mouse" && Math.abs(dy) > Math.abs(dx)
          ? dy / host.clientHeight
          : dx / host.clientWidth;
      target = Math.max(
        0,
        Math.min(media.duration - 0.04, target + delta * 2.4 * media.duration),
      );
      schedule();
    };
    const reset = () => {
      previous = null;
      dragging = false;
    };
    const onDown = (event: PointerEvent) => {
      if (
        event.pointerType !== "touch" ||
        (event.target as Element).closest("a,button")
      )
        return;
      dragging = true;
      previous = { x: event.clientX, y: event.clientY };
      // pan-y leaves vertical page scrolling to the browser; horizontal dragging scrubs.
    };
    const onPlay = () => {
      interacting = false;
      setPlaying(true);
    };
    const onPause = () => {
      if (!interacting) target = media.currentTime;
      setPlaying(false);
    };
    const onPreference = () => {
      setReduced(preference.matches);
      if (preference.matches) media.pause();
    };
    const onVisibility = () => {
      if (document.hidden) {
        media.pause();
        reset();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        media.pause();
        reset();
      }
    });
    observer.observe(host);
    onPreference();
    if (media.readyState >= 1) onLoaded();
    media.addEventListener("loadedmetadata", onLoaded);
    media.addEventListener("seeked", onSeeked);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", reset);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", reset);
    host.addEventListener("pointercancel", reset);
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      media.removeEventListener("loadedmetadata", onLoaded);
      media.removeEventListener("seeked", onSeeked);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", reset);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", reset);
      host.removeEventListener("pointercancel", reset);
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <div ref={surface} className="mf-robot" aria-hidden="true">
        {!failed && (
          <video
            className="background"
            aria-label="复古电脑头机器人动画"
            ref={video}
            src={ROBOT_VIDEO}
            muted
            playsInline
            loop
            preload="auto"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="wash" aria-hidden="true" />
      <div className="hint">
        <span>
          {failed
            ? english
              ? "A work in progress. Always."
              : "保持好奇，持续构建。"
            : reduced
              ? english
                ? "Motion reduced"
                : "已减少动态效果"
              : english
                ? "Move to explore · scroll to discover"
                : "移动鼠标互动 · 滚轮浏览页面"}
        </span>
        {!failed && (
          <button
            type="button"
            aria-pressed={playing}
            onClick={async () => {
              const media = video.current;
              if (!media) return;
              if (media.paused) {
                interactionEnabled.current = false;
                setInteractive(false);
                try {
                  await media.play();
                } catch {
                  setFailed(true);
                }
              } else media.pause();
            }}
          >
            {playing
              ? english
                ? "Pause"
                : "暂停"
              : english
                ? "Play motion"
                : "播放动画"}
          </button>
        )}
        {!failed && !reduced && (
          <button
            type="button"
            aria-pressed={interactive}
            onClick={() => {
              const next = !interactive;
              interactionEnabled.current = next;
              setInteractive(next);
              if (next) video.current?.pause();
            }}
          >
            {interactive ? "退出互动" : "鼠标互动"}
          </button>
        )}
      </div>
    </>
  );
}
