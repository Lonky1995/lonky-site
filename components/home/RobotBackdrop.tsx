"use client";

import { useEffect, useRef } from "react";

/** The phone follows pointer position directly; no video decoding or React updates per frame. */
export function RobotBackdrop() {
  const surface = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const eyes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = surface.current;
    const phone = head.current;
    const gaze = eyes.current;
    const host = stage?.closest<HTMLElement>(".hero");
    if (!stage || !phone || !gaze || !host) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let bounds = host.getBoundingClientRect();
    let visible = true;
    let frame = 0;
    let previousTime = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0;

    const render = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || preference.matches) return;
      // Time-based damping keeps the same fast response on 60 Hz and 120 Hz displays.
      const delta = previousTime ? Math.min(50, time - previousTime) : 16.67;
      previousTime = time;
      const blend = 1 - Math.exp(-delta / 32);
      x += (targetX - x) * blend;
      y += (targetY - y) * blend;
      phone.style.transform = `rotateX(${-y * 14}deg) rotateY(${x * 25 - 9}deg) rotateZ(${x * 3 - 3}deg)`;
      gaze.style.transform = `translate(${x * 13}px, ${y * 10}px)`;
      stage.dataset.pointer = `${x.toFixed(3)},${y.toFixed(3)}`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.001) frame = requestAnimationFrame(render);
      else previousTime = 0;
    };
    const start = () => {
      if (!frame && visible && !document.hidden && !preference.matches) frame = requestAnimationFrame(render);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || preference.matches) return;
      targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      start();
    };
    const reset = () => { targetX = 0; targetY = 0; start(); };
    const resize = () => { bounds = host.getBoundingClientRect(); };
    const updatePreference = () => {
      cancelAnimationFrame(frame); frame = 0; previousTime = 0;
      if (preference.matches) {
        x = y = targetX = targetY = 0;
        phone.style.transform = "rotateY(-9deg) rotateZ(-3deg)";
        gaze.style.transform = "none";
        stage.dataset.pointer = "0.000,0.000";
      } else start();
    };
    const visibility = () => {
      cancelAnimationFrame(frame); frame = 0; previousTime = 0;
      if (!document.hidden) { resize(); start(); }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { resize(); start(); }
      else { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    });
    observer.observe(host);
    const resizer = new ResizeObserver(resize);
    resizer.observe(host);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", resize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    preference.addEventListener("change", updatePreference);
    updatePreference();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); resizer.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", reset);
      window.removeEventListener("scroll", resize);
      document.removeEventListener("visibilitychange", visibility);
      preference.removeEventListener("change", updatePreference);
    };
  }, []);

  return (
    <div ref={surface} className="phone-character" aria-hidden="true">
      <div className="phone-character-halo" />
      <div className="phone-portrait">
        <div className="phone-torso" />
        <div className="phone-head-stage">
          <div ref={head} className="phone-head">
            <div className="phone-back" />
            <div className="phone-edge phone-edge-left"><i /><i /><i /></div>
            <div className="phone-edge phone-edge-right"><i /></div>
            <div className="phone-edge phone-edge-top" />
            <div className="phone-edge phone-edge-bottom" />
            <div className="phone-front">
              <div className="phone-screen">
                <div className="phone-island"><span /></div>
                <div ref={eyes} className="phone-eyes"><span /><span /></div>
                <div className="phone-smile" />
                <div className="phone-home-indicator" />
              </div>
              <div className="phone-glass" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
