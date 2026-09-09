'use client';

import { useEffect, useRef } from 'react';

/**
 * One continuous decorative backdrop for the whole page: faint grid, soft
 * backlights spread down the document, and a canvas of drifting space
 * particles.
 *
 * It is deliberately page-level (not per section) so backlights cross
 * section boundaries instead of being clipped at every divider.
 *
 * Performance / a11y guards:
 *  - density scales down under 768px
 *  - the RAF loop pauses when the tab is hidden
 *  - `prefers-reduced-motion` renders a single static frame
 *  - the whole layer is inert (pointer-events-none, aria-hidden)
 */

type Particle = { x: number; y: number; z: number; vx: number; vy: number; r: number };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function SpaceField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Particles/cubes must invert on a light surface or they vanish.
    let light = document.documentElement.classList.contains('light');
    const themeObserver = new MutationObserver(() => {
      const next = document.documentElement.classList.contains('light');
      if (next !== light) { light = next; draw(); }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let lastScroll = window.scrollY;

    const seed = () => {
      const compact = width < 768;
      const particleCount = compact ? 38 : Math.min(120, Math.round(width / 12));

      particles = Array.from({ length: particleCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        z: rand(0.25, 1),
        vx: rand(-0.16, 0.16),
        vy: rand(-0.16, 0.16),
        r: rand(0.5, 1.7),
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
        ctx.fillStyle = light
          ? `rgba(30, 41, 59, ${0.10 + p.z * 0.24})`
          : `rgba(226, 232, 240, ${0.12 + p.z * 0.32})`;
        ctx.fill();
      }
    };

    const wrap = (v: number, max: number, margin: number) => {
      if (v < -margin) return max + margin;
      if (v > max + margin) return -margin;
      return v;
    };

    const step = () => {
      // Scroll nudges the field so it feels attached to the page, while the
      // canvas itself stays viewport-fixed and therefore never gets clipped.
      const scroll = window.scrollY;
      const delta = scroll - lastScroll;
      lastScroll = scroll;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy - delta * p.z * 0.06;
        p.x = wrap(p.x, width, 4);
        p.y = wrap(p.y, height, 4);
      }

      draw();
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (!raf && !reduced) {
        lastScroll = window.scrollY;
        raf = requestAnimationFrame(step);
      }
    };
    const stop = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    resize();
    draw();
    start();

    const onResize = () => { resize(); draw(); };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
    />
  );
}

/**
 * Backlights spread down the full document height so every section sits near
 * one, and none of them stops at a section divider.
 */
const BACKLIGHTS: { pos: string; alpha: number }[] = [
  { pos: 'left-1/2 top-[-8rem] h-[680px] w-[min(1150px,150vw)] -translate-x-1/2 blur-[150px]', alpha: 0.15 },
  { pos: 'left-[-12%] top-[18%] h-[540px] w-[min(720px,110vw)] blur-[145px]', alpha: 0.10 },
  { pos: 'right-[-10%] top-[38%] h-[540px] w-[min(700px,105vw)] blur-[145px]', alpha: 0.095 },
  { pos: 'left-[6%] top-[62%] h-[540px] w-[min(740px,110vw)] blur-[150px]', alpha: 0.095 },
  { pos: 'right-[-8%] bottom-[-5%] h-[560px] w-[min(760px,110vw)] blur-[150px]', alpha: 0.13 },
];

/** Wraps page content and paints the continuous decorative layer behind it. */
export function PageDecor({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate">
      {/* Fixed starfield: continuous, never clipped by a section. */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <SpaceField />
      </div>

      {/* Grid + backlights scroll with the document, spanning its full height. */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-grid opacity-[0.55]" />
        {BACKLIGHTS.map((b, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${b.pos}`}
            style={{
              // boost lifts the wash on light surfaces; the cap keeps it a tint, not a flood
              background: `hsl(var(--backlight) / min(0.22, calc(${b.alpha} * var(--backlight-boost))))`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
