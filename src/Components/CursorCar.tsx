import { useEffect, useRef } from "react";
import CarIcon from "./CarIcon";

// ── Physics ───────────────────────────────────────────────────────────────────
const STEER_RATE = 0.14;
const DRIVE_FORCE = 0.12;
const FORWARD_DRAG = 0.92;
const LATERAL_GRIP = 0.55;
const MAX_SPEED = 40;
const STOP_DIST = 100;

// ── Skid trail ────────────────────────────────────────────────────────────────
const TRAIL_SPACING = 4; // min px between sampled points
const TRAIL_MAX_W = 4; // peak width of the stroke (px)
const TRAIL_RAMP_UP = 0.7;
const TRAIL_RAMP_DOWN = 0.5;
const TRAIL_DECAY = 0.04; // faster fade
const TRAIL_MIN_PTS = 3;
const TRAIL_MAX_PTS = 14; // cap — seal & restart trail when exceeded
const SKID_TURN_RATE = 0.055; // only sharp turns — filters out gentle steering
const SKID_MIN_SPEED = 2.0; // must be moving at pace too

// ── Smoke / burnout ───────────────────────────────────────────────────────────
const BURNOUT_SPEED_OUT = 1.0;
const BURNOUT_SPEED_IN = 1.2;
const BURNOUT_FRAMES = 28;
const CIRCLE_FRAMES_NEEDED = 14;
const CIRCLE_GRIP = 0.2;
const CIRCLE_SMOKE_EVERY = 10;

const WHEEL_BACK = 13;
const WHEEL_SIDE = 7;
// ─────────────────────────────────────────────────────────────────────────────

type TrailPt = { x: number; y: number; w: number };
type SkidTrail = {
  pts: TrailPt[];
  alpha: number;
  active: boolean;
  lastX: number;
  lastY: number;
};
type Lobe = { dx: number; dy: number; lr: number };
type SmokePart = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  lobes: Lobe[];
};

// ── Draw one complete tapered skid stroke ─────────────────────────────────────
function drawSkidTrail(ctx: CanvasRenderingContext2D, trail: SkidTrail) {
  const pts = trail.pts;
  if (pts.length < 2) return;

  // Build left/right offset edges for the variable-width polygon
  const L: { x: number; y: number }[] = [];
  const R: { x: number; y: number }[] = [];

  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next.x - prev.x,
      dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len,
      py = dx / len; // perpendicular
    const hw = pts[i].w / 2;
    L.push({ x: pts[i].x + px * hw, y: pts[i].y + py * hw });
    R.push({ x: pts[i].x - px * hw, y: pts[i].y - py * hw });
  }

  // ── Filled body ────────────────────────────────────────────────────────────
  ctx.fillStyle = `rgba(140,136,130,${trail.alpha.toFixed(3)})`;
  ctx.beginPath();

  // Left edge — smooth quadratic bezier through each point
  ctx.moveTo(L[0].x, L[0].y);
  for (let i = 1; i < L.length - 1; i++) {
    const mx = (L[i].x + L[i + 1].x) / 2;
    const my = (L[i].y + L[i + 1].y) / 2;
    ctx.quadraticCurveTo(L[i].x, L[i].y, mx, my);
  }
  ctx.lineTo(L[L.length - 1].x, L[L.length - 1].y);

  // Right edge — traverse in reverse
  for (let i = R.length - 1; i >= 1; i--) {
    const mx = (R[i].x + R[i - 1].x) / 2;
    const my = (R[i].y + R[i - 1].y) / 2;
    ctx.quadraticCurveTo(R[i].x, R[i].y, mx, my);
  }
  ctx.lineTo(R[0].x, R[0].y);
  ctx.closePath();
  ctx.fill();

  // ── Thin centre spine (adds depth like the reference image) ───────────────
  ctx.strokeStyle = `rgba(85,82,77,${(trail.alpha * 0.65).toFixed(3)})`;
  ctx.lineWidth = 0.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
}

// ── Cartoon cloud smoke ───────────────────────────────────────────────────────
function makeSmokeLobes(count: number): Lobe[] {
  const lobes: Lobe[] = [];
  lobes.push({ dx: 0, dy: 0, lr: 0.42 + Math.random() * 0.16 });
  for (let i = 1; i < count; i++) {
    const angle =
      ((i - 1) / (count - 1)) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
    lobes.push({
      dx: Math.cos(angle) * (0.28 + Math.random() * 0.32),
      dy: Math.sin(angle) * (0.28 + Math.random() * 0.32),
      lr: 0.2 + Math.random() * 0.22,
    });
  }
  return lobes;
}

function drawCartoonSmoke(ctx: CanvasRenderingContext2D, p: SmokePart) {
  const { x, y, r, alpha, lobes } = p;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = `rgba(105,102,112,${alpha.toFixed(3)})`;
  for (const l of lobes) {
    ctx.beginPath();
    ctx.arc(l.dx * r, l.dy * r, l.lr * r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(68,66,75,${(alpha * 0.9).toFixed(3)})`;
  ctx.lineWidth = 0.9;
  for (const l of lobes) {
    ctx.beginPath();
    ctx.arc(l.dx * r, l.dy * r, l.lr * r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function lerpAngleRad(from: number, to: number, t: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return from + diff * t;
}

// ─────────────────────────────────────────────────────────────────────────────
const CursorCar = () => {
  const carRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    x: -300,
    y: -300,
    vx: 0,
    vy: 0,
    heading: 0,
    prevHeading: 0,
    prevSpeed: 0,
    turnStreak: 0,
    trailW: 0, // current stroke width accumulator
  });

  // One active trail per rear wheel; finished trails just fade
  const leftTrailRef = useRef<SkidTrail | null>(null);
  const rightTrailRef = useRef<SkidTrail | null>(null);
  const finishedRef = useRef<SkidTrail[]>([]);
  const smokeRef = useRef<SmokePart[]>([]);

  const mouseRef = useRef({ x: -300, y: -300 });
  const initRef = useRef(false);
  const rafRef = useRef<number>(0);
  const burnoutRef = useRef(0);
  const circleSmokeTimer = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
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
        s.heading = s.prevHeading = Math.atan2(
          e.clientY - s.y,
          e.clientX - s.x,
        );
        initRef.current = true;
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    // Append a point to a trail if the wheel moved enough
    const appendPoint = (
      trail: SkidTrail,
      wx: number,
      wy: number,
      w: number,
    ) => {
      const dL = Math.sqrt((wx - trail.lastX) ** 2 + (wy - trail.lastY) ** 2);
      if (dL < TRAIL_SPACING) return;
      trail.pts.push({ x: wx, y: wy, w });
      trail.lastX = wx;
      trail.lastY = wy;
    };

    // Close an active trail: add a tapered tail then move to finished
    const sealTrail = (
      trail: SkidTrail,
      hx: number,
      hy: number,
      currentW: number,
    ) => {
      const last = trail.pts[trail.pts.length - 1];
      const steps = 5;
      const tailLen = currentW * 0.5;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        trail.pts.push({
          x: last.x + hx * tailLen * t,
          y: last.y + hy * tailLen * t,
          w: currentW * (1 - t),
        });
      }
      trail.active = false;
      if (trail.pts.length >= TRAIL_MIN_PTS) finishedRef.current.push(trail);
    };

    const spawnCloud = (
      x: number,
      y: number,
      hx: number,
      hy: number,
      lx: number,
      ly: number,
      big = false,
    ) => {
      const lobeCount = big
        ? 5 + Math.floor(Math.random() * 3)
        : 4 + Math.floor(Math.random() * 2);
      const outward = big ? (Math.random() - 0.3) * 1.2 : 0;
      smokeRef.current.push({
        x: x + (Math.random() - 0.5) * (big ? 8 : 5),
        y: y + (Math.random() - 0.5) * (big ? 8 : 5),
        vx:
          -hx * (0.2 + Math.random() * 0.35) +
          lx * outward +
          (Math.random() - 0.5) * 0.3,
        vy:
          -hy * (0.2 + Math.random() * 0.35) +
          ly * outward +
          (Math.random() - 0.5) * 0.3,
        r: big ? 5 + Math.random() * 4 : 3 + Math.random() * 3,
        alpha: big ? 0.6 + Math.random() * 0.2 : 0.4 + Math.random() * 0.18,
        lobes: makeSmokeLobes(lobeCount),
      });
    };

    const animate = () => {
      const s = stateRef.current;
      const m = mouseRef.current;

      if (initRef.current) {
        const dx = m.x - s.x,
          dy = m.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        s.heading = lerpAngleRad(s.heading, Math.atan2(dy, dx), STEER_RATE);

        const hx = Math.cos(s.heading),
          hy = Math.sin(s.heading);
        const lx = -Math.sin(s.heading),
          ly = Math.cos(s.heading);

        // ── Circle drift detection ──────────────────────────────────────
        let hdDiff = s.heading - s.prevHeading;
        while (hdDiff > Math.PI) hdDiff -= 2 * Math.PI;
        while (hdDiff < -Math.PI) hdDiff += 2 * Math.PI;
        const turnRate = Math.abs(hdDiff);
        const turnSign = hdDiff > 0.001 ? 1 : hdDiff < -0.001 ? -1 : 0;

        if (turnSign !== 0 && Math.sign(s.turnStreak) === turnSign)
          s.turnStreak += turnSign;
        else if (turnSign !== 0) s.turnStreak = turnSign;
        else s.turnStreak *= 0.85;

        const inCircleDrift = Math.abs(s.turnStreak) >= CIRCLE_FRAMES_NEEDED;

        // ── Physics ─────────────────────────────────────────────────────
        const grip = inCircleDrift
          ? CIRCLE_GRIP
          : burnoutRef.current > 0
            ? 0.3
            : LATERAL_GRIP;
        let fwdVel = s.vx * hx + s.vy * hy;
        let latVel = s.vx * lx + s.vy * ly;

        if (dist > STOP_DIST) {
          fwdVel =
            fwdVel * FORWARD_DRAG +
            DRIVE_FORCE * MAX_SPEED * (1 - FORWARD_DRAG);
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

        const rearX = s.x - WHEEL_BACK * hx,
          rearY = s.y - WHEEL_BACK * hy;
        const wlX = rearX + WHEEL_SIDE * lx,
          wlY = rearY + WHEEL_SIDE * ly;
        const wrX = rearX - WHEEL_SIDE * lx,
          wrY = rearY - WHEEL_SIDE * ly;

        // ── Burnout launch (handled independently — no trail) ────────────
        if (s.prevSpeed < BURNOUT_SPEED_OUT && speed > BURNOUT_SPEED_IN) {
          burnoutRef.current = BURNOUT_FRAMES;
          for (let i = 0; i < 2; i++)
            spawnCloud(rearX, rearY, hx, hy, lx, ly, true);
          // One-shot fixed drag streak stamped backwards — NOT a live trail
          const stamp = (wx: number, wy: number) => {
            const t: SkidTrail = {
              pts: [],
              alpha: 0.88,
              active: false,
              lastX: wx,
              lastY: wy,
            };
            const steps = 8;
            for (let i = steps; i >= 0; i--) {
              const frac = i / steps;
              t.pts.push({
                x: wx - hx * frac * 18,
                y: wy - hy * frac * 18,
                w: TRAIL_MAX_W * Math.sin(frac * Math.PI),
              });
            }
            if (t.pts.length >= TRAIL_MIN_PTS) finishedRef.current.push(t);
          };
          stamp(wlX, wlY);
          stamp(wrX, wrY);
        }
        if (burnoutRef.current > 0) {
          burnoutRef.current--;
          if (burnoutRef.current % 6 === 0)
            spawnCloud(rearX, rearY, hx, hy, lx, ly, false);
        }

        // ── Skid trail — only sharp turns + circle drift ─────────────────
        const doSkid =
          inCircleDrift ||
          (turnRate > SKID_TURN_RATE && speed > SKID_MIN_SPEED);

        if (doSkid) {
          s.trailW = inCircleDrift
            ? TRAIL_MAX_W
            : Math.min(TRAIL_MAX_W, s.trailW + TRAIL_RAMP_UP);

          if (!leftTrailRef.current) {
            leftTrailRef.current = {
              pts: [{ x: wlX, y: wlY, w: 0 }],
              alpha: 0.88,
              active: true,
              lastX: wlX,
              lastY: wlY,
            };
            rightTrailRef.current = {
              pts: [{ x: wrX, y: wrY, w: 0 }],
              alpha: 0.88,
              active: true,
              lastX: wrX,
              lastY: wrY,
            };
          }

          appendPoint(leftTrailRef.current, wlX, wlY, s.trailW);
          appendPoint(rightTrailRef.current!, wrX, wrY, s.trailW);

          // Cap length — seal and restart so circle marks stay short
          if (leftTrailRef.current.pts.length >= TRAIL_MAX_PTS) {
            sealTrail(leftTrailRef.current, hx, hy, s.trailW);
            sealTrail(rightTrailRef.current!, hx, hy, s.trailW);
            leftTrailRef.current = {
              pts: [{ x: wlX, y: wlY, w: s.trailW }],
              alpha: 0.88,
              active: true,
              lastX: wlX,
              lastY: wlY,
            };
            rightTrailRef.current = {
              pts: [{ x: wrX, y: wrY, w: s.trailW }],
              alpha: 0.88,
              active: true,
              lastX: wrX,
              lastY: wrY,
            };
          }

          // Circle drift smoke
          if (inCircleDrift) {
            circleSmokeTimer.current++;
            if (circleSmokeTimer.current >= CIRCLE_SMOKE_EVERY) {
              circleSmokeTimer.current = 0;
              spawnCloud(wlX, wlY, hx, hy, lx, ly, true);
              spawnCloud(wrX, wrY, hx, hy, lx, ly, true);
            }
          }
        } else {
          circleSmokeTimer.current = 0;
          s.trailW = Math.max(0, s.trailW - TRAIL_RAMP_DOWN);

          if (leftTrailRef.current) {
            sealTrail(leftTrailRef.current, hx, hy, s.trailW);
            sealTrail(rightTrailRef.current!, hx, hy, s.trailW);
            leftTrailRef.current = null;
            rightTrailRef.current = null;
          }
        }

        s.prevHeading = s.heading;
        s.prevSpeed = speed;

        const car = carRef.current;
        if (car)
          car.style.transform = `translate(${s.x - 28}px, ${s.y - 15}px) rotate(${s.heading * (180 / Math.PI)}deg)`;
      }

      // ── Draw ────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Active trails (draw live without fading)
      if (leftTrailRef.current) drawSkidTrail(ctx, leftTrailRef.current);
      if (rightTrailRef.current) drawSkidTrail(ctx, rightTrailRef.current);

      // Finished trails — fade out
      const fin = finishedRef.current;
      for (let i = fin.length - 1; i >= 0; i--) {
        drawSkidTrail(ctx, fin[i]);
        fin[i].alpha -= TRAIL_DECAY;
        if (fin[i].alpha <= 0) fin.splice(i, 1);
      }

      // Smoke
      for (let i = smokeRef.current.length - 1; i >= 0; i--) {
        const p = smokeRef.current[i];
        drawCartoonSmoke(ctx, p);
        p.x += p.vx;
        p.y += p.vy;
        p.r += 0.22;
        p.alpha -= 0.02;
        if (p.alpha <= 0) smokeRef.current.splice(i, 1);
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
        <CarIcon />
      </div>
    </>
  );
};

export default CursorCar;
