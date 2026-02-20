"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  hue: number;
  sat: number;
  depth: number; // 0~1, 0=far 1=near — controls parallax strength
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    // Mouse state
    let mouseX = -9999;
    let mouseY = -9999;
    // Smoothed mouse for parallax (lerp target)
    let smoothX = 0;
    let smoothY = 0;
    const MOUSE_RADIUS = 200;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const onMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    function initStars() {
      stars = [];
      const area = canvas!.width * canvas!.height;
      const count = Math.floor(area / 3000);

      for (let i = 0; i < count; i++) {
        const isBright = Math.random() < 0.08;
        const hasTint = Math.random() < 0.25;
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          size: isBright
            ? Math.random() * 1.8 + 1
            : Math.random() * 1.2 + 0.3,
          baseOpacity: isBright
            ? Math.random() * 0.4 + 0.5
            : Math.random() * 0.3 + 0.1,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
          hue: hasTint ? 220 + Math.random() * 40 : 0,
          sat: hasTint ? 30 : 0,
          depth: Math.random(),
        });
      }
    }

    function spawnShootingStar() {
      const c = canvasRef.current;
      if (!c) return;
      const edge = Math.random();
      let x: number, y: number, angle: number;
      if (edge < 0.5) {
        // From top
        x = Math.random() * c.width;
        y = -10;
        angle = Math.PI * 0.2 + Math.random() * 0.3;
      } else {
        // From right
        x = c.width + 10;
        y = Math.random() * c.height * 0.5;
        angle = Math.PI * 0.6 + Math.random() * 0.3;
      }
      const speed = 8 + Math.random() * 6;
      shootingStars.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size: 1.5 + Math.random() * 1,
      });
    }

    resize();
    window.addEventListener("resize", resize);

    // Spawn shooting stars periodically
    let nextShoot = 120 + Math.random() * 300;

    let time = 0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Smooth parallax offset
      const targetX = mouseX > -9000 ? (mouseX - canvas.width / 2) : 0;
      const targetY = mouseY > -9000 ? (mouseY - canvas.height / 2) : 0;
      smoothX += (targetX - smoothX) * 0.03;
      smoothY += (targetY - smoothY) * 0.03;

      // --- Draw stars ---
      for (const s of stars) {
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset);
        let opacity = s.baseOpacity + twinkle * 0.15;
        if (opacity <= 0) continue;

        // Parallax offset based on depth
        const parallax = s.depth * 0.015;
        const drawX = s.x + smoothX * parallax;
        const drawY = s.y + smoothY * parallax;

        // Mouse proximity brightening
        if (mouseX > -9000) {
          const dx = drawX - mouseX;
          const dy = drawY - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            const boost = 1 - dist / MOUSE_RADIUS;
            opacity = Math.min(1, opacity + boost * 0.5);
          }
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, ${s.sat}%, 95%, ${Math.max(0, opacity)})`;
        ctx.fill();

        // Soft glow for bright stars
        if (s.size > 1.2 && opacity > 0.4) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, s.size * 3, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(
            drawX, drawY, 0,
            drawX, drawY, s.size * 3
          );
          g.addColorStop(0, `hsla(240, 40%, 80%, ${opacity * 0.15})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      // --- Mouse glow aura ---
      if (mouseX > -9000) {
        const g = ctx.createRadialGradient(
          mouseX, mouseY, 0,
          mouseX, mouseY, MOUSE_RADIUS
        );
        g.addColorStop(0, "rgba(99, 102, 241, 0.04)");
        g.addColorStop(0.5, "rgba(139, 92, 246, 0.02)");
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, MOUSE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // --- Shooting stars ---
      nextShoot -= 1;
      if (nextShoot <= 0) {
        spawnShootingStar();
        nextShoot = 180 + Math.random() * 400;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life += 1;

        const progress = ss.life / ss.maxLife;
        // Fade in then out
        const alpha = progress < 0.1
          ? progress / 0.1
          : 1 - (progress - 0.1) / 0.9;

        if (alpha <= 0 || ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
          continue;
        }

        // Draw trail
        const tailLen = 40 + ss.size * 10;
        const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * tailLen;
        const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * tailLen;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, `rgba(200, 210, 255, ${alpha * 0.8})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.size;
        ctx.lineCap = "round";
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, ss.size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 225, 255, ${alpha * 0.9})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
