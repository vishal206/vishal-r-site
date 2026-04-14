import { useEffect, useRef } from "react";

// ── Physics ───────────────────────────────────────────────────────────────────
const STEER_RATE    = 0.14;
const DRIVE_FORCE   = 0.12;
const FORWARD_DRAG  = 0.92;
const LATERAL_GRIP  = 0.55;
const MAX_SPEED     = 40;
const STOP_DIST     = 52;

// ── Effects ───────────────────────────────────────────────────────────────────
const SKID_TURN_RATE = 0.018; // min heading-change (rad/frame) to leave marks
const SKID_MIN_SPEED = 0.3;
const SKID_SPACING   = 2;     // min px between segment starts
const SKID_DECAY     = 0.012;

const BURNOUT_SPEED_OUT = 1.0;
const BURNOUT_SPEED_IN  = 1.2;
const BURNOUT_FRAMES    = 28;

const WHEEL_BACK = 13;
const WHEEL_SIDE = 7;
// ─────────────────────────────────────────────────────────────────────────────

// Each skid mark is a tiny line segment for one wheel
type SkidSeg = {
  x1: number; y1: number;
  x2: number; y2: number;
  alpha: number;
};

type SmokePart = {
  x: number; y: number;
  vx: number; vy: number;
  r: number; alpha: number;
};

// Draw one tire-track segment: manga ink-style hatched strokes, no glow
function drawTireTrack(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  alpha: number,
) {
  const dx  = x2 - x1;
  const dy  = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.4) return;

  // Perpendicular unit vector — for groove offsets
  const px = -dy / len;
  const py =  dx / len;

  // Hard flat caps — no soft/round blur at segment ends
  ctx.lineCap  = "butt";
  ctx.lineJoin = "miter";

  // ① Solid track body — sharp edges
  ctx.strokeStyle = `rgba(155,150,145,${alpha.toFixed(3)})`;
  ctx.lineWidth   = 5.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

  // ② Tread grooves — thin dark lines within the body (manga hatching)
  ctx.strokeStyle = `rgba(85,82,78,${(alpha * 0.9).toFixed(3)})`;
  ctx.lineWidth   = 0.9;
  for (const off of [-1.8, -0.5, 0.5, 1.8]) {
    ctx.beginPath();
    ctx.moveTo(x1 + px * off, y1 + py * off);
    ctx.lineTo(x2 + px * off, y2 + py * off);
    ctx.stroke();
  }

  // ③ Hard outer edge lines — crisp boundary strokes like ink outlines
  ctx.strokeStyle = `rgba(110,107,103,${(alpha * 0.8).toFixed(3)})`;
  ctx.lineWidth   = 0.7;
  for (const off of [-2.9, 2.9]) {
    ctx.beginPath();
    ctx.moveTo(x1 + px * off, y1 + py * off);
    ctx.lineTo(x2 + px * off, y2 + py * off);
    ctx.stroke();
  }
}

function lerpAngleRad(from: number, to: number, t: number): number {
  let diff = to - from;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return from + diff * t;
}

const CursorCar = () => {
  const carRef    = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    x: -300, y: -300,
    vx: 0, vy: 0,
    heading: 0,
    prevHeading: 0,
    prevSpeed: 0,
  });

  // Two separate track arrays — one per wheel — so left/right draw independently
  const leftMarksRef  = useRef<SkidSeg[]>([]);
  const rightMarksRef = useRef<SkidSeg[]>([]);
  const smokeRef      = useRef<SmokePart[]>([]);

  const mouseRef     = useRef({ x: -300, y: -300 });
  const initRef      = useRef(false);
  const rafRef       = useRef<number>(0);
  const burnoutRef   = useRef(0);
  const lastWheelRef = useRef({ lx: 0, ly: 0, rx: 0, ry: 0, set: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!initRef.current) {
        const s = stateRef.current;
        s.x = e.clientX - 150;
        s.y = e.clientY + 80;
        s.heading     = Math.atan2(e.clientY - s.y, e.clientX - s.x);
        s.prevHeading = s.heading;
        initRef.current = true;
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const animate = () => {
      const s = stateRef.current;
      const m = mouseRef.current;

      if (initRef.current) {
        // ── Physics ────────────────────────────────────────────────────────
        const dx   = m.x - s.x;
        const dy   = m.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        s.heading = lerpAngleRad(s.heading, Math.atan2(dy, dx), STEER_RATE);

        const hx =  Math.cos(s.heading);
        const hy =  Math.sin(s.heading);
        const lx = -Math.sin(s.heading);
        const ly =  Math.cos(s.heading);

        let fwdVel = s.vx * hx + s.vy * hy;
        let latVel = s.vx * lx + s.vy * ly;

        const grip = burnoutRef.current > 0 ? 0.30 : LATERAL_GRIP;

        if (dist > STOP_DIST) {
          fwdVel = fwdVel * FORWARD_DRAG + DRIVE_FORCE * MAX_SPEED * (1 - FORWARD_DRAG);
          fwdVel = Math.min(fwdVel, MAX_SPEED);
        } else {
          fwdVel *= 0.75;
        }
        latVel *= grip;

        s.vx = fwdVel * hx + latVel * lx;
        s.vy = fwdVel * hy + latVel * ly;
        s.x += s.vx;
        s.y += s.vy;

        const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

        // Rear wheel world positions
        const rearX = s.x - WHEEL_BACK * hx;
        const rearY = s.y - WHEEL_BACK * hy;
        const wlX   = rearX + WHEEL_SIDE * lx;
        const wlY   = rearY + WHEEL_SIDE * ly;
        const wrX   = rearX - WHEEL_SIDE * lx;
        const wrY   = rearY - WHEEL_SIDE * ly;

        // ── Burnout: stopped → any movement ────────────────────────────────
        if (s.prevSpeed < BURNOUT_SPEED_OUT && speed > BURNOUT_SPEED_IN) {
          burnoutRef.current = BURNOUT_FRAMES;

          for (let i = 0; i < 14; i++) {
            smokeRef.current.push({
              x:     rearX + (Math.random() - 0.5) * 12,
              y:     rearY + (Math.random() - 0.5) * 12,
              vx:    -hx * (0.5 + Math.random()) + (Math.random() - 0.5),
              vy:    -hy * (0.5 + Math.random()) + (Math.random() - 0.5),
              r:     6 + Math.random() * 6,
              alpha: 0.7 + Math.random() * 0.25,
            });
          }

          // Drag-start skid streak (segments going backwards from current pos)
          for (let i = 0; i < 8; i++) {
            const t0 = (i / 8) * 16;
            const t1 = ((i + 1) / 8) * 16;
            leftMarksRef.current.push({
              x1: wlX - hx * t0, y1: wlY - hy * t0,
              x2: wlX - hx * t1, y2: wlY - hy * t1,
              alpha: 0.9,
            });
            rightMarksRef.current.push({
              x1: wrX - hx * t0, y1: wrY - hy * t0,
              x2: wrX - hx * t1, y2: wrY - hy * t1,
              alpha: 0.9,
            });
          }
        }

        // Ongoing smoke + skid during burnout window
        if (burnoutRef.current > 0) {
          burnoutRef.current--;
          if (burnoutRef.current % 2 === 0) {
            smokeRef.current.push({
              x:     rearX + (Math.random() - 0.5) * 10,
              y:     rearY + (Math.random() - 0.5) * 10,
              vx:    -hx * 0.4 + (Math.random() - 0.5) * 0.6,
              vy:    -hy * 0.4 + (Math.random() - 0.5) * 0.6,
              r:     5 + Math.random() * 5,
              alpha: 0.5 + Math.random() * 0.3,
            });
          }
          // Force segment from last → current wheel pos during burnout
          const lw = lastWheelRef.current;
          if (lw.set) {
            leftMarksRef.current.push({ x1: lw.lx, y1: lw.ly, x2: wlX, y2: wlY, alpha: 0.85 });
            rightMarksRef.current.push({ x1: lw.rx, y1: lw.ry, x2: wrX, y2: wrY, alpha: 0.85 });
          }
        }

        // ── Turn skid marks ─────────────────────────────────────────────────
        let hdDiff = s.heading - s.prevHeading;
        while (hdDiff >  Math.PI) hdDiff -= 2 * Math.PI;
        while (hdDiff < -Math.PI) hdDiff += 2 * Math.PI;
        const turnRate = Math.abs(hdDiff);

        if (turnRate > SKID_TURN_RATE && speed > SKID_MIN_SPEED) {
          const lw = lastWheelRef.current;
          const dL = lw.set
            ? Math.sqrt((wlX - lw.lx) ** 2 + (wlY - lw.ly) ** 2)
            : 999;

          if (dL >= SKID_SPACING && lw.set) {
            const intensity = Math.min(turnRate / 0.08, 1);
            leftMarksRef.current.push({
              x1: lw.lx, y1: lw.ly, x2: wlX, y2: wlY,
              alpha: 0.82 * intensity,
            });
            rightMarksRef.current.push({
              x1: lw.rx, y1: lw.ry, x2: wrX, y2: wrY,
              alpha: 0.82 * intensity,
            });
          }
        }

        // Always track last wheel positions for segment continuity
        lastWheelRef.current = { lx: wlX, ly: wlY, rx: wrX, ry: wrY, set: true };
        s.prevHeading = s.heading;
        s.prevSpeed   = speed;

        const car = carRef.current;
        if (car) {
          car.style.transform = `translate(${s.x - 20}px, ${s.y - 12}px) rotate(${s.heading * (180 / Math.PI)}deg)`;
        }
      }

      // ── Draw ──────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Skid tracks — draw segments with tread-groove style
      for (const segs of [leftMarksRef.current, rightMarksRef.current]) {
        for (let i = segs.length - 1; i >= 0; i--) {
          const seg = segs[i];
          drawTireTrack(ctx, seg.x1, seg.y1, seg.x2, seg.y2, seg.alpha);
          seg.alpha -= SKID_DECAY;
          if (seg.alpha <= 0) segs.splice(i, 1);
        }
      }

      // Smoke
      const smoke = smokeRef.current;
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,218,215,${p.alpha.toFixed(3)})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        p.r     += 0.4;
        p.alpha -= 0.018;
        if (p.alpha <= 0) smoke.splice(i, 1);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />
      <div
        ref={carRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9999,
          willChange: "transform",
        }}
      >
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4"  y="0"  width="9" height="6" rx="3" fill="#111" />
          <rect x="27" y="0"  width="9" height="6" rx="3" fill="#111" />
          <rect x="4"  y="18" width="9" height="6" rx="3" fill="#111" />
          <rect x="27" y="18" width="9" height="6" rx="3" fill="#111" />
          <rect x="2"  y="4"  width="36" height="16" rx="5" fill="#d62828" />
          <rect x="9"  y="6"  width="19" height="12" rx="3" fill="#b71c1c" />
          <rect x="24" y="7.5" width="8" height="9"  rx="2" fill="#b3d9f2" opacity="0.85" />
          <rect x="8"  y="7.5" width="6" height="9"  rx="2" fill="#b3d9f2" opacity="0.55" />
          <rect x="37" y="7"  width="2" height="4" rx="1" fill="#fff59d" />
          <rect x="37" y="13" width="2" height="4" rx="1" fill="#fff59d" />
          <rect x="1"  y="7"  width="2" height="4" rx="1" fill="#ff1744" />
          <rect x="1"  y="13" width="2" height="4" rx="1" fill="#ff1744" />
        </svg>
      </div>
    </>
  );
};

export default CursorCar;
