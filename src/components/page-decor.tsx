'use client';

import { useEffect, useRef } from 'react';

/**
 * One continuous decorative backdrop for the whole page: faint grid, soft
 * backlights spread down the document, and a canvas of drifting space
 * particles + free-floating wireframe cubes.
 *
 * It is deliberately page-level (not per section) so cubes and backlights
 * cross section boundaries instead of being clipped at every divider.
 *
 * Performance / a11y guards:
 *  - density scales down under 768px
 *  - the RAF loop pauses when the tab is hidden
 *  - `prefers-reduced-motion` renders a single static frame
 *  - the whole layer is inert (pointer-events-none, aria-hidden)
 */

type Particle = { x: number; y: number; z: number; vx: number; vy: number; r: number };
type Cube = {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  size: number;
  rx: number; ry: number; rz: number;
  drx: number; dry: number; drz: number;
  parallax: number;
};

const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 3], [3, 2], [2, 0],
  [4, 5], [5, 7], [7, 6], [6, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const CUBE_CORNERS: [number, number, number][] = [
  [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1],
];

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
    let cubes: Cube[] = [];
    let raf = 0;
    let lastScroll = window.scrollY;

    const seed = () => {
      const compact = width < 768;
      const particleCount = compact ? 38 : Math.min(120, Math.round(width / 12));
      const cubeCount = compact ? 3 : 6;

      particles = Array.from({ length: particleCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        z: rand(0.25, 1),
        vx: rand(-0.16, 0.16),
        vy: rand(-0.16, 0.16),
        r: rand(0.5, 1.7),
      }));

      cubes = Array.from({ length: cubeCount }, () => ({
        x: rand(0.04, 0.96) * width,
        y: rand(0.04, 0.96) * height,
        z: rand(-90, 90),
        vx: rand(-0.24, 0.24),
        vy: rand(-0.2, 0.2),
        vz: rand(-0.09, 0.09),
        size: compact ? rand(12, 24) : rand(16, 34),
        rx: rand(0, Math.PI * 2),
        ry: rand(0, Math.PI * 2),
        rz: rand(0, Math.PI * 2),
        drx: rand(-0.0045, 0.0045),
        dry: rand(-0.0045, 0.0045),
        drz: rand(-0.003, 0.003),
        parallax: rand(0.04, 0.16),
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

    const projectCube = (c: Cube) => {
      const sinX = Math.sin(c.rx), cosX = Math.cos(c.rx);
      const sinY = Math.sin(c.ry), cosY = Math.cos(c.ry);
      const sinZ = Math.sin(c.rz), cosZ = Math.cos(c.rz);
      const focal = 420;

      return CUBE_CORNERS.map(([px, py, pz]) => {
        let x = px * c.size;
        let y = py * c.size;
        let z = pz * c.size;

        let ty = y * cosX - z * sinX;
        let tz = y * sinX + z * cosX;
        y = ty; z = tz;

        let tx = x * cosY + z * sinY;
        tz = -x * sinY + z * cosY;
        x = tx; z = tz;

        tx = x * cosZ - y * sinZ;
        ty = x * sinZ + y * cosZ;
        x = tx; y = ty;

        const depth = focal / (focal + z + c.z);
        return { x: c.x + x * depth, y: c.y + y * depth, depth };
      });
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

      for (const c of cubes) {
        const pts = projectCube(c);
        const avgDepth = pts.reduce((s, p) => s + p.depth, 0) / pts.length;
        ctx.strokeStyle = light
          ? `rgba(21, 128, 87, ${0.14 + avgDepth * 0.20})`
          : `rgba(62, 207, 142, ${0.09 + avgDepth * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [a, b] of CUBE_EDGES) {
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
        }
        ctx.stroke();
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

      for (const c of cubes) {
        c.x += c.vx;
        c.y += c.vy - delta * c.parallax;
        c.z += c.vz;
        c.rx += c.drx; c.ry += c.dry; c.rz += c.drz;

        c.x = wrap(c.x, width, 70);
        c.y = wrap(c.y, height, 70);
        if (c.z < -140 || c.z > 140) c.vz *= -1;
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
      {/* Fixed starfield + cubes: continuous, never clipped by a section. */}
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
