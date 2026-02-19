"use client";

import { useEffect, useRef } from "react";

type OrbParticle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
  opacity: number;
  orbitTilt: number;
  phase: number;
};

export function CosmicOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const SIZE = 560;
    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(DPR, DPR);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const baseRadius = SIZE * 0.32;

    // Orbit particles
    const particles: OrbParticle[] = [];
    const RING_COUNT = 5;
    const PER_RING = 40;

    for (let r = 0; r < RING_COUNT; r++) {
      const ringRadius = baseRadius * 0.4 + (baseRadius * 0.7 * r) / RING_COUNT;
      const tilt = (Math.PI * 0.15 * r) / RING_COUNT + Math.random() * 0.1;
      for (let i = 0; i < PER_RING; i++) {
        const hueBase = r % 2 === 0 ? 250 : 200;
        particles.push({
          angle: (Math.PI * 2 * i) / PER_RING + Math.random() * 0.3,
          radius: ringRadius + (Math.random() - 0.5) * 15,
          speed: (0.003 + Math.random() * 0.004) * (r % 2 === 0 ? 1 : -1),
          size: Math.random() * 1.8 + 0.5,
          hue: hueBase + Math.random() * 40,
          opacity: Math.random() * 0.5 + 0.3,
          orbitTilt: tilt,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Floating dust
    const dust: OrbParticle[] = [];
    for (let i = 0; i < 60; i++) {
      dust.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * baseRadius * 1.2,
        speed: (Math.random() - 0.5) * 0.002,
        size: Math.random() * 1 + 0.3,
        hue: 220 + Math.random() * 60,
        opacity: Math.random() * 0.25 + 0.05,
        orbitTilt: Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left - cx;
      mouseRef.current.y = e.clientY - rect.top - cy;
      mouseRef.current.active = true;
    };
    const onLeave = () => { mouseRef.current.active = false; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      time += 1;

      const mouse = mouseRef.current;
      // Mouse influence on rotation tilt
      const tiltX = mouse.active ? mouse.y * 0.0008 : 0;
      const tiltY = mouse.active ? mouse.x * 0.0006 : 0;

      // --- Core glow ---
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.5);
      coreGlow.addColorStop(0, "rgba(139, 92, 246, 0.25)");
      coreGlow.addColorStop(0.3, "rgba(99, 102, 241, 0.12)");
      coreGlow.addColorStop(0.6, "rgba(6, 182, 212, 0.04)");
      coreGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
      ctx.fill();

      // Pulsing inner core
      const pulse = Math.sin(time * 0.015) * 0.3 + 0.7;
      const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.18);
      innerGlow.addColorStop(0, `rgba(167, 139, 250, ${0.35 * pulse})`);
      innerGlow.addColorStop(0.5, `rgba(129, 140, 248, ${0.15 * pulse})`);
      innerGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();

      // Bright center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 210, 255, ${0.6 + pulse * 0.3})`;
      ctx.fill();

      // --- Orbit rings (faint ellipses) ---
      ctx.save();
      ctx.translate(cx, cy);
      for (let r = 0; r < RING_COUNT; r++) {
        const ringR = baseRadius * 0.4 + (baseRadius * 0.7 * r) / RING_COUNT;
        const tilt = (Math.PI * 0.15 * r) / RING_COUNT;
        ctx.save();
        ctx.rotate(tilt + tiltY);
        ctx.scale(1, 0.35 + tiltX);
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.06 - r * 0.008})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // --- Orbit particles ---
      for (const p of particles) {
        p.angle += p.speed;

        const wobble = Math.sin(time * 0.01 + p.phase) * 5;
        const r = p.radius + wobble;
        const tilt = p.orbitTilt + tiltY;
        const squeeze = 0.35 + tiltX;

        const px = cx + Math.cos(p.angle + tilt) * r;
        const py = cy + Math.sin(p.angle + tilt) * r * squeeze;

        // Depth-based opacity: front is brighter
        const depthFactor = Math.sin(p.angle + tilt) * 0.3 + 0.7;
        const alpha = p.opacity * depthFactor;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 75%, ${alpha})`;
        ctx.fill();

        // Glow trail for larger particles
        if (p.size > 1.2) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
          g.addColorStop(0, `hsla(${p.hue}, 60%, 70%, ${alpha * 0.2})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      // --- Floating dust ---
      for (const d of dust) {
        d.angle += d.speed;
        const wobble = Math.sin(time * 0.008 + d.phase) * 8;
        const dx = cx + Math.cos(d.angle) * (d.radius + wobble);
        const dy = cy + Math.sin(d.angle) * (d.radius + wobble) * 0.6;

        ctx.beginPath();
        ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${d.hue}, 50%, 80%, ${d.opacity})`;
        ctx.fill();
      }

      // --- Outer halo ---
      const halo = ctx.createRadialGradient(cx, cy, baseRadius * 0.7, cx, cy, baseRadius * 1.3);
      halo.addColorStop(0, "transparent");
      halo.addColorStop(0.5, "rgba(99, 102, 241, 0.015)");
      halo.addColorStop(0.8, "rgba(6, 182, 212, 0.01)");
      halo.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-none select-none"
      style={{ width: 560, height: 560 }}
    />
  );
}
