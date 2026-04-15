import { Link } from "react-router-dom";
import { BlogPostMeta } from "../Utils/markdownLoader";

// ── Disk tunables ────────────────────────────────────────────────
const SPINDLE_SIZE = 14; // % of disk diameter
const HUB_SIZE = 24; // % of disk diameter — clear center ring
const ART_MASK_INNER = 13; // % — where poster art starts (from center)
const RIM_INNER = 96; // % — inner edge of the rim (lower = wider rim)
// ────────────────────────────────────────────────────────────────

type Props = {
  post: BlogPostMeta;
  tilt?: number;
};

const MovieDisk = ({ post, tilt = 0 }: Props) => {
  const hubInset = `${(100 - HUB_SIZE) / 2}%`;
  const spindleOffset = `${(100 - SPINDLE_SIZE) / 2}%`;
  const rimMask = `radial-gradient(circle at 50% 50%, transparent ${RIM_INNER}%, black ${RIM_INNER + 0.5}%, black 100%)`;

  return (
    <Link
      to={`/archive/${post.slug}`}
      className="group flex flex-col items-center gap-5 shrink-0"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {/* ── Disk ── */}
      <div className="relative w-36 h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-full select-none">
        {/* Base: silver disc */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, #d8d8d8 0%, #aaaaaa 40%, #888888 100%)",
          }}
        />

        {/* Poster art — fades out near hub and rim */}
        {post.image && (
          <div
            className="absolute rounded-full overflow-hidden"
            style={{ inset: "3%" }}
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
              draggable={false}
              style={{
                maskImage: `radial-gradient(
                  circle at 50% 50%,
                  transparent ${ART_MASK_INNER}%,
                  black ${ART_MASK_INNER + 7}%,
                  black ${RIM_INNER}%,
                  transparent ${RIM_INNER + 1}%
                )`,
                WebkitMaskImage: `radial-gradient(
                  circle at 50% 50%,
                  transparent ${ART_MASK_INNER}%,
                  black ${ART_MASK_INNER + 7}%,
                  black ${RIM_INNER}%,
                  transparent ${RIM_INNER + 1}%
                )`,
              }}
            />
          </div>
        )}

        {/* Gloss highlight — top-left */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(
              ellipse at 35% 28%,
              rgba(255,255,255,0.22) 0%,
              rgba(255,255,255,0.06) 35%,
              transparent 65%
            )`,
          }}
        />

        {/* DVD iridescence on hover */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `conic-gradient(
              from 200deg at 50% 50%,
              transparent 0deg,
              rgba(180,100,255,0.18) 40deg,
              rgba(80,200,255,0.18) 90deg,
              rgba(100,255,160,0.18) 140deg,
              rgba(255,220,60,0.18) 190deg,
              rgba(255,80,80,0.18) 240deg,
              transparent 280deg
            )`,
            mixBlendMode: "screen",
          }}
        />

        {/* Outer rim — glassy iridescent DVD ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(
              from 0deg at 50% 50%,
              #ffffff        0deg,
              #cce8ff       30deg,
              #66aaee       70deg,
              #aa66ff      110deg,
              #223366      150deg,
              #111122      180deg,
              #334488      210deg,
              #55aacc      250deg,
              #88ddff      290deg,
              #ccf0ff      330deg,
              #ffffff      360deg
            )`,
            maskImage: rimMask,
            WebkitMaskImage: rimMask,
          }}
        />

        {/* Hub — flat silver */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: hubInset,
            background: "#c0c0c0",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
          }}
        />

        {/* Spindle hole */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${SPINDLE_SIZE}%`,
            height: `${SPINDLE_SIZE}%`,
            top: spindleOffset,
            left: spindleOffset,
            background: "#111111",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
          }}
        />

        {/* ── Title overlay ── */}
        <div
          className="absolute inset-0 flex items-end justify-center pb-[18%] pointer-events-none"
          style={{ transform: `rotate(${-tilt}deg)` }}
        >
          <span
            className="text-black leading-tight text-center"
            style={{
              fontFamily: "'Caveat', cursive",
              fontWeight: 600,
              fontSize: "clamp(0.75rem, 3.5cqi, 1.1rem)",
              background: "rgba(255,255,255,0.82)",
              padding: "2px 10px 3px",
              borderRadius: "2px",
              maxWidth: "72%",
              display: "inline-block",
              boxShadow: "0 1px 4px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.6)",
              transform: "rotate(-1.5deg)",
            }}
          >
            {post.title}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MovieDisk;
