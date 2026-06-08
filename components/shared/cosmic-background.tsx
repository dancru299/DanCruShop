"use client";

import { useEffect, useRef } from "react";

/**
 * Animated monochrome cosmic backdrop: twinkling starfield, faint milky-way
 * band, soft glow blob, a handful of greyscale ringed planets, mouse parallax
 * and the occasional shooting star. Pure canvas (one layer), sprites cached,
 * pauses when the tab is hidden, and falls back to a static frame when the user
 * prefers reduced motion.
 *
 * Rendered fixed behind all content. To reveal it on a page/section, give that
 * area a transparent background.
 */

type Star = {
  x: number; y: number; r: number; a: number; tw: number; ph: number;
  vx: number; vy: number; z: number; tint: string; bright: boolean;
};
type Dust = { x: number; y: number; r: number; a: number; tw: number; ph: number };
type Shooter = {
  x: number; y: number; vx: number; vy: number; life: number; max: number; len: number;
};
type RingLine = { r: number; alpha: number; w: number };
type Ring = { tilt: number; flat: number; lines: RingLine[] };
type Sprite = { sprite: HTMLCanvasElement; draw: number; body: number };
type Planet = {
  m: Sprite; x: number; y: number; amp: number; sp: number; ph: number;
  par: number; alpha: number; ring?: Ring;
};

export function CosmicBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    let W = 0, H = 0, DPR = 1;

    // parallax (mouse)
    let pmx = 0, pmy = 0, pcx = 0, pcy = 0;
    const MAXP = 26;
    const onMove = (e: PointerEvent) => {
      pmx = (e.clientX / window.innerWidth - 0.5) * 2;
      pmy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

    // cached soft glow sprite
    const glow = document.createElement("canvas");
    glow.width = glow.height = 32;
    {
      const g = glow.getContext("2d")!;
      const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      rg.addColorStop(0, "rgba(255,255,255,1)");
      rg.addColorStop(0.28, "rgba(225,230,240,.6)");
      rg.addColorStop(1, "rgba(200,210,230,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, 32, 32);
    }

    // soft white glow blob (galaxy core)
    function makeGalaxy(size: number) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const x = c.getContext("2d")!;
      const r = size / 2;
      const g = x.createRadialGradient(r, r, 0, r, r, r * 0.2);
      g.addColorStop(0, "rgba(255,255,255,.95)");
      g.addColorStop(0.45, "rgba(238,242,255,.45)");
      g.addColorStop(1, "rgba(220,226,240,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);
      const d = x.createRadialGradient(r, r, r * 0.12, r, r, r * 0.96);
      d.addColorStop(0, "rgba(255,255,255,.05)");
      d.addColorStop(0.6, "rgba(255,255,255,.02)");
      d.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = d;
      x.fillRect(0, 0, size, size);
      return c;
    }

    // procedural greyscale planet (moon / gas / ice) + optional surface bands
    function makePlanet(
      size: number,
      o: {
        lightAngle?: number; palette?: string[]; bands?: number;
        craters?: number; noise?: number; halo?: number; rim?: number;
      },
    ): Sprite {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const x = c.getContext("2d")!;
      const r = size / 2;
      const lang = o.lightAngle ?? -2.35;
      const ldx = Math.cos(lang), ldy = Math.sin(lang);

      x.save();
      x.beginPath();
      x.arc(r, r, r - 1, 0, TAU);
      x.clip();

      const pal = o.palette ?? ["#d9dce2", "#9a9ea8", "#55585f", "#24262b"];
      const lx = r + ldx * r * 0.55, ly = r + ldy * r * 0.55;
      const g = x.createRadialGradient(lx, ly, r * 0.15, r, r, r * 1.25);
      g.addColorStop(0, pal[0]);
      g.addColorStop(0.45, pal[1]);
      g.addColorStop(0.8, pal[2]);
      g.addColorStop(1, pal[3]);
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);

      // latitude bands ("đường vân") for gas / ice giants
      if (o.bands) {
        const n = o.bands;
        for (let i = 0; i < n; i++) {
          const y0 = (i / n) * size, h = size / n, dark = i % 2 === 0;
          x.globalAlpha = dark ? 0.15 : 0.06;
          x.fillStyle = dark ? "#14161a" : "#eef0f6";
          x.fillRect(0, y0, size, h * 0.92);
        }
        x.globalAlpha = 0.22;
        x.strokeStyle = "rgba(16,18,22,.7)";
        x.lineWidth = Math.max(1, size * 0.006);
        for (let i = 1; i < n; i++) {
          const yy = (i / n) * size;
          x.beginPath();
          x.moveTo(0, yy);
          x.lineTo(size, yy);
          x.stroke();
        }
        x.globalAlpha = 0.12;
        x.strokeStyle = "rgba(255,255,255,.8)";
        x.lineWidth = Math.max(1, size * 0.004);
        for (let i = 0; i < n; i += 2) {
          const yy = (i / n) * size + (size / n) * 0.3;
          x.beginPath();
          x.moveTo(0, yy);
          x.lineTo(size, yy);
          x.stroke();
        }
        x.globalAlpha = 1;
      }

      // craters for rocky bodies
      if (o.craters) {
        for (let i = 0; i < o.craters; i++) {
          const ang = Math.random() * TAU;
          const rad = Math.pow(Math.random(), 0.6) * (r * 0.92);
          const cx = r + Math.cos(ang) * rad, cy = r + Math.sin(ang) * rad;
          const cr = rand(size * 0.012, size * 0.06);
          x.globalAlpha = 0.45;
          x.fillStyle = "#3b3e45";
          x.beginPath();
          x.arc(cx, cy, cr, 0, TAU);
          x.fill();
          x.globalAlpha = 0.5;
          x.lineWidth = Math.max(1, cr * 0.5);
          x.lineCap = "round";
          x.strokeStyle = "rgba(10,11,14,.55)";
          x.beginPath();
          x.arc(cx, cy, cr * 0.82, lang - 0.9, lang + 0.9);
          x.stroke();
          x.strokeStyle = "rgba(255,255,255,.16)";
          x.beginPath();
          x.arc(cx, cy, cr * 0.82, lang + 2.24, lang + 4.04);
          x.stroke();
        }
        x.globalAlpha = 1;
      }

      // fine surface noise
      const noise = (o.noise ?? 4) * size;
      for (let i = 0; i < noise; i++) {
        x.globalAlpha = 0.05 + Math.random() * 0.06;
        x.fillStyle = Math.random() < 0.5 ? "#000" : "#fff";
        x.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
      x.globalAlpha = 1;

      // terminator (phase shading)
      x.globalCompositeOperation = "multiply";
      const tg = x.createLinearGradient(lx, ly, r - ldx * r * 1.3, r - ldy * r * 1.3);
      tg.addColorStop(0, "rgba(255,255,255,1)");
      tg.addColorStop(0.55, "rgba(120,120,128,1)");
      tg.addColorStop(1, "rgba(18,19,23,1)");
      x.fillStyle = tg;
      x.fillRect(0, 0, size, size);
      x.globalCompositeOperation = "source-over";

      // rim light on dark limb
      x.globalCompositeOperation = "lighter";
      const rim = x.createRadialGradient(r, r, r * 0.86, r, r, r);
      rim.addColorStop(0, "rgba(255,255,255,0)");
      rim.addColorStop(1, `rgba(185,195,215,${o.rim ?? 0.1})`);
      x.fillStyle = rim;
      x.fillRect(0, 0, size, size);
      x.globalCompositeOperation = "source-over";
      x.restore();

      // soft outer halo (padded canvas)
      const pad = Math.round(size * 0.5), full = size + pad * 2;
      const h = document.createElement("canvas");
      h.width = h.height = full;
      const hx = h.getContext("2d")!;
      const hr = full / 2;
      const hg = hx.createRadialGradient(hr, hr, size * 0.46, hr, hr, hr);
      hg.addColorStop(0, `rgba(255,255,255,${o.halo ?? 0.06})`);
      hg.addColorStop(1, "rgba(255,255,255,0)");
      hx.fillStyle = hg;
      hx.fillRect(0, 0, full, full);
      hx.drawImage(c, pad, pad);
      return { sprite: h, draw: full, body: size };
    }

    // tilted ring around a planet — half = "back" | "front"
    function drawRing(cx: number, cy: number, bodyR: number, ring: Ring, half: "back" | "front") {
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(ring.tilt);
      for (const ln of ring.lines) {
        const rx = bodyR * ln.r, ry = rx * ring.flat;
        ctx!.beginPath();
        if (half === "back") ctx!.ellipse(0, 0, rx, ry, 0, Math.PI, TAU);
        else ctx!.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
        ctx!.lineWidth = ln.w * DPR;
        ctx!.lineCap = "round";
        ctx!.strokeStyle = `rgba(226,229,238,${ln.alpha})`;
        ctx!.stroke();
      }
      ctx!.restore();
    }

    let stars: Star[] = [], milky: Dust[] = [], planets: Planet[] = [];
    const shooters: Shooter[] = [];
    let galaxy: HTMLCanvasElement | null = null, gx = 0, gy = 0;

    function build() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas!.width = window.innerWidth * DPR;
      H = canvas!.height = window.innerHeight * DPR;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      const area = window.innerWidth * window.innerHeight, s = DPR;

      const N = Math.min(640, Math.round(area / 2600));
      stars = [];
      for (let i = 0; i < N; i++) {
        const warm = Math.random() < 0.15, rr = rand(0.4, 1.7);
        stars.push({
          x: Math.random() * W, y: Math.random() * H, r: rr * DPR,
          a: rand(0.25, 1), tw: rand(0.4, 1.3), ph: Math.random() * 6.28,
          vx: rand(-0.012, 0.012) * DPR, vy: rand(0.004, 0.022) * DPR,
          z: 0.2 + ((rr - 0.4) / 1.3) * 0.95,
          tint: warm ? "255,250,240" : "255,255,255", bright: Math.random() < 0.1,
        });
      }

      const M = Math.min(620, Math.round(area / 2700));
      milky = [];
      const ang = (-21 * Math.PI) / 180, cx = W * 0.5, cy = H * 0.4;
      for (let i = 0; i < M; i++) {
        const along = rand(-W * 0.78, W * 0.78);
        const across = ((Math.random() + Math.random() + Math.random() - 1.5) / 1.5) * H * 0.15;
        milky.push({
          x: cx + along * Math.cos(ang) - across * Math.sin(ang),
          y: cy + along * Math.sin(ang) + across * Math.cos(ang),
          r: rand(0.3, 0.95) * DPR, a: rand(0.05, 0.4), tw: rand(0.4, 1.4), ph: Math.random() * 6.28,
        });
      }

      const gsize = Math.round(Math.min(Math.min(W, H) * 1.25, 1500));
      galaxy = makeGalaxy(gsize);
      gx = W * 0.5;
      gy = H * 0.5;

      const P_LIGHT = ["#e7e9ef", "#b0b4be", "#64676f", "#2b2d33"];
      const P_DARK = ["#bdc0c8", "#7f828c", "#46484f", "#1c1e23"];
      const P_GAS = ["#cfd2da", "#9498a2", "#5a5d65", "#26282e"];

      planets = [
        {
          m: makePlanet(Math.round(208 * s), { lightAngle: -2.3, bands: 9, noise: 1.6, halo: 0.05, rim: 0.1, palette: P_GAS }),
          x: W * 0.85, y: H * 0.2, amp: 13 * s, sp: 0.01, ph: 0, par: 1.5, alpha: 1,
          ring: { tilt: -0.34, flat: 0.3, lines: [{ r: 1.42, alpha: 0.42, w: 5 }, { r: 1.66, alpha: 0.5, w: 8 }, { r: 1.92, alpha: 0.28, w: 4 }] },
        },
        {
          m: makePlanet(Math.round(124 * s), { lightAngle: -0.6, craters: 15, halo: 0.04, rim: 0.09, palette: P_DARK }),
          x: W * 0.12, y: H * 0.78, amp: 11 * s, sp: 0.013, ph: 2.1, par: 1.05, alpha: 1,
          ring: { tilt: 0.42, flat: 0.22, lines: [{ r: 1.5, alpha: 0.3, w: 4 }, { r: 1.82, alpha: 0.4, w: 6 }] },
        },
        {
          m: makePlanet(Math.round(82 * s), { lightAngle: -2.6, bands: 6, noise: 2, halo: 0.035, rim: 0.08, palette: P_LIGHT }),
          x: W * 0.27, y: H * 0.16, amp: 9 * s, sp: 0.016, ph: 1, par: 0.78, alpha: 0.94,
          ring: { tilt: -0.5, flat: 0.26, lines: [{ r: 1.5, alpha: 0.3, w: 3 }] },
        },
        {
          m: makePlanet(Math.round(58 * s), { lightAngle: 0.4, bands: 5, noise: 1.8, halo: 0.03, rim: 0.07, palette: P_GAS }),
          x: W * 0.76, y: H * 0.84, amp: 7 * s, sp: 0.019, ph: 3.4, par: 0.6, alpha: 0.85,
          ring: { tilt: 0.3, flat: 0.24, lines: [{ r: 1.55, alpha: 0.26, w: 3 }] },
        },
        {
          m: makePlanet(Math.round(36 * s), { lightAngle: -1.7, craters: 5, halo: 0.025, rim: 0.06, palette: P_LIGHT }),
          x: W * 0.64, y: H * 0.13, amp: 6 * s, sp: 0.022, ph: 0.6, par: 0.42, alpha: 0.72,
          ring: { tilt: -0.2, flat: 0.3, lines: [{ r: 1.7, alpha: 0.22, w: 2 }] },
        },
      ];
    }

    function spawnShooter() {
      const fromTop = Math.random() < 0.7;
      const x = fromTop ? rand(0, W * 0.85) : -40 * DPR;
      const y = fromTop ? -40 * DPR : rand(0, H * 0.5);
      const sp = rand(7, 12) * DPR, dir = rand(0.25, 0.6);
      shooters.push({ x, y, vx: sp, vy: sp * dir, life: 0, max: rand(60, 95), len: rand(120, 260) * DPR });
    }

    let t = 0, lastShoot = 0, rafId = 0;
    function frame() {
      t++;
      ctx!.clearRect(0, 0, W, H);
      pcx += (pmx - pcx) * 0.05;
      pcy += (pmy - pcy) * 0.05;
      const ox = -pcx * MAXP * DPR, oy = -pcy * MAXP * DPR;

      if (galaxy) {
        ctx!.save();
        ctx!.translate(gx + ox * 0.2, gy + oy * 0.2);
        ctx!.scale(1, 0.7);
        ctx!.globalAlpha = 0.9;
        ctx!.drawImage(galaxy, -galaxy.width / 2, -galaxy.height / 2);
        ctx!.restore();
        ctx!.globalAlpha = 1;
      }

      for (const sd of milky) {
        const a = reduce ? sd.a : sd.a * (0.74 + 0.26 * Math.sin(t * 0.018 * sd.tw + sd.ph));
        ctx!.globalAlpha = a;
        ctx!.fillStyle = "#fff";
        ctx!.fillRect(sd.x + ox * 0.14, sd.y + oy * 0.14, sd.r, sd.r);
      }

      for (const st of stars) {
        if (!reduce) {
          st.x += st.vx;
          st.y += st.vy;
          if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
          if (st.x > W) st.x = 0; else if (st.x < 0) st.x = W;
        }
        const a = reduce ? st.a : st.a * (0.7 + 0.3 * Math.sin(t * 0.024 * st.tw + st.ph));
        const dx = st.x + ox * st.z, dy = st.y + oy * st.z;
        if (st.bright) {
          const g = st.r * 7;
          ctx!.globalAlpha = a * 0.8;
          ctx!.drawImage(glow, dx - g / 2, dy - g / 2, g, g);
        }
        ctx!.globalAlpha = a;
        ctx!.fillStyle = `rgba(${st.tint},1)`;
        ctx!.beginPath();
        ctx!.arc(dx, dy, st.r, 0, TAU);
        ctx!.fill();
      }

      for (const o of planets) {
        const cx = o.x + ox * o.par;
        const cy = o.y + oy * o.par + (reduce ? 0 : Math.sin(t * o.sp + o.ph) * o.amp);
        const bodyR = o.m.body / 2;
        if (o.ring) drawRing(cx, cy, bodyR, o.ring, "back");
        ctx!.globalAlpha = o.alpha;
        ctx!.drawImage(o.m.sprite, cx - o.m.draw / 2, cy - o.m.draw / 2, o.m.draw, o.m.draw);
        ctx!.globalAlpha = 1;
        if (o.ring) drawRing(cx, cy, bodyR, o.ring, "front");
      }

      if (!reduce) {
        if (t - lastShoot > rand(80, 160) && shooters.length < 2 && Math.random() < 0.06) {
          spawnShooter();
          lastShoot = t;
        }
        for (let i = shooters.length - 1; i >= 0; i--) {
          const m = shooters[i];
          m.life++;
          m.x += m.vx;
          m.y += m.vy;
          const k = Math.min(1, m.life / 12) * Math.max(0, 1 - (m.life - m.max * 0.6) / (m.max * 0.4));
          const hyp = Math.hypot(m.vx, m.vy);
          const tx = m.x - (m.vx / hyp) * m.len, ty = m.y - (m.vy / hyp) * m.len;
          const grad = ctx!.createLinearGradient(m.x, m.y, tx, ty);
          grad.addColorStop(0, `rgba(255,255,255,${0.9 * k})`);
          grad.addColorStop(0.3, `rgba(220,225,235,${0.45 * k})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx!.globalAlpha = 1;
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 2 * DPR;
          ctx!.lineCap = "round";
          ctx!.beginPath();
          ctx!.moveTo(m.x, m.y);
          ctx!.lineTo(tx, ty);
          ctx!.stroke();
          ctx!.globalAlpha = k;
          ctx!.drawImage(glow, m.x - 9 * DPR, m.y - 9 * DPR, 18 * DPR, 18 * DPR);
          if (m.life > m.max || m.x > W + m.len || m.y > H + m.len) shooters.splice(i, 1);
        }
      }

      ctx!.globalAlpha = 1;
      if (!reduce) rafId = requestAnimationFrame(frame);
    }

    const onResize = () => {
      build();
      if (reduce) frame();
    };

    const onVisibility = () => {
      if (reduce) return;
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!rafId) {
        rafId = requestAnimationFrame(frame);
      }
    };

    build();
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (!reduce) window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className ?? ""}`}
      style={{
        background:
          "radial-gradient(130% 100% at 50% -20%, #0c0f1c 0%, #07080f 50%, #04050a 100%)",
      }}
    >
      <canvas ref={canvasRef} className="block size-full" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 40%, transparent 50%, rgba(3,4,9,.72) 100%)",
        }}
      />
    </div>
  );
}
