"use client";

import { useEffect, useRef } from "react";

/** The camera follows pointer position directly; no video decoding or React updates per frame. */
export function RobotBackdrop() {
  const surface = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const eyes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = surface.current;
    const camera = head.current;
    const gaze = eyes.current;
    const host = stage?.closest<HTMLElement>(".hero");
    if (!stage || !camera || !gaze || !host) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let bounds = host.getBoundingClientRect();
    let visible = true;
    let frame = 0;
    let previousTime = 0;
    let breathingTime = 0;
    let idleWeight = 1;
    let lastPointerMove = -Infinity;
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
      // One continuous phase prevents a jump when pointer tracking settles.
      // Freeze this clock while hidden/offscreen rather than skipping ahead on resume.
      breathingTime += delta;
      const phase = (breathingTime / 6200) * Math.PI * 2;
      const idleTarget = time - lastPointerMove < 250 ? 0.35 : 1;
      idleWeight += (idleTarget - idleWeight) * (1 - Math.exp(-delta / 280));
      const driftX = Math.sin(phase) * 3 * idleWeight;
      const driftY = (Math.cos(phase) - 1) * 4 * idleWeight;
      const nod = Math.sin(phase + Math.PI / 3) * 0.9 * idleWeight;
      const tilt = Math.sin(phase) * 1.1 * idleWeight;
      camera.style.transform = `translate3d(${driftX}px, ${driftY}px, 0) rotateX(${-y * 8 + nod}deg) rotateY(${x * 14}deg) rotateZ(${x * 2 + tilt}deg)`;
      gaze.style.transform = `translate(${x * 8}px, ${y * 6}px)`;
      stage.dataset.pointer = `${x.toFixed(3)},${y.toFixed(3)}`;
      frame = requestAnimationFrame(render);
    };
    const start = () => {
      if (!frame && visible && !document.hidden && !preference.matches) frame = requestAnimationFrame(render);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || preference.matches) return;
      lastPointerMove = performance.now();
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
        camera.style.transform = "none";
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
    <div ref={surface} className="camera-character" aria-hidden="true">
      <div className="camera-character-halo" />
      <div className="camera-portrait">
        <div className="camera-torso" />
        <div className="camera-head-stage">
          <div ref={head} className="camera-head">
            <div className="camera-shell" />
            <div className="camera-lens-face">
              <div ref={eyes} className="camera-gaze">
                <div className="camera-eyes"><span /><span /></div>
                <div className="camera-smile" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
