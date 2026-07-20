import React from "react";
import { Link } from "react-router-dom";
import { BlogPostMeta } from "../Utils/markdownLoader";

// ── Disk tunables ────────────────────────────────────────────────
const SPINDLE_SIZE = 14; // % of disk diameter
const HUB_SIZE = 24; // % of disk diameter — clear center ring
const ART_MASK_INNER = 13; // % — where poster art starts (from center)
const RIM_INNER = 95; // % — inner edge of the glass rim band (lower = wider)
// ────────────────────────────────────────────────────────────────

// The glass rim, painted rather than made transparent. Low-opacity white over a
// dark page just reads as grey, so instead the band carries its own colour and
// shading: a saturated oil-slick iridescence around the ring (the refraction), a
// rounded cross-section that's dark at both edges and bright across the crown
// (the depth/thickness), two sharp near-white speculars (the shine), and crisp
// bright bevel lines at the inner and outer edges. None of it depends on the
// background, so it reads as glass on black — or anything else — the same way.
//
// Every radial layer is `closest-side`: without it a circle gradient defaults to
// farthest-*corner*, so a "95%" stop lands ~1.41× further out (off the disk) and
// the ring never renders — which is exactly why the edge used to look grey.
// Stops live in the RIM_INNER..100% band; retune them if RIM_INNER changes.
const RIM_BACKGROUND = `
  radial-gradient(circle closest-side at 50% 50%,
    transparent 94.7%,
    rgba(255,255,255,0.9) 95.4%,
    transparent 96.3%,
    transparent 99%,
    rgba(255,255,255,0.95) 99.75%,
    transparent 100%),
  radial-gradient(46% 46% at 29% 21%,
    rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 52%),
  radial-gradient(38% 38% at 75% 81%,
    rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 52%),
  radial-gradient(circle closest-side at 50% 50%,
    transparent 95%,
    rgba(0,0,0,0.35) 95.6%,
    rgba(255,255,255,0.18) 97.5%,
    rgba(0,0,0,0.4) 99.5%,
    transparent 100%),
  conic-gradient(from 200deg at 50% 50%,
    #7cc4ff, #c39bff, #7dffcf, #ffe486, #ff93b4, #86bbff, #7cc4ff)
`;

type Props = {
  post: BlogPostMeta;
  tilt?: number;
  diskClassName?: string;
  // Where the disk links. Defaults to the post's archive page; pass `null` for
  // a non-linking disk (e.g. a watched/wishlist entry with no review).
  to?: string | null;
};

const MovieDisk = ({
  post,
  tilt = 0,
  diskClassName = "w-36 h-36 md:w-44 md:h-44 lg:w-52 lg:h-52",
  to = `/archive/${post.slug}`,
}: Props) => {
  const hubInset = `${(100 - HUB_SIZE) / 2}%`;
  const spindleOffset = `${(100 - SPINDLE_SIZE) / 2}%`;
  const rimMask = `radial-gradient(circle closest-side at 50% 50%, transparent ${RIM_INNER}%, black ${RIM_INNER + 0.5}%, black 100%)`;
  // The silver data disc stops just shy of the rim, so the painted glass band sits
  // on its own rather than over an opaque grey ring.
  const baseMask = `radial-gradient(circle closest-side at 50% 50%, black ${RIM_INNER - 1}%, transparent ${RIM_INNER}%)`;

  const className = "group flex flex-col items-center gap-5 shrink-0";
  const style = { transform: `rotate(${tilt}deg)` };

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    to ? (
      <Link to={to} className={className} style={style}>
        {children}
      </Link>
    ) : (
      <div className={className} style={style}>
        {children}
      </div>
    );

  return (
    <Wrapper>
      {/* ── Disk ── */}
      <div className={`relative ${diskClassName} rounded-full select-none`}>
        {/* Base: silver data disc — clipped to just inside the glass rim */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, #d8d8d8 0%, #aaaaaa 40%, #888888 100%)",
            maskImage: baseMask,
            WebkitMaskImage: baseMask,
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

        {/* Outer rim — painted glass band (see RIM_BACKGROUND). Opaque and
            self-shaded, so it reads as glass on any background. */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: RIM_BACKGROUND,
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
              boxShadow:
                "0 1px 4px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.6)",
              transform: "rotate(-1.5deg)",
            }}
          >
            {post.title}
          </span>
        </div>
      </div>
    </Wrapper>
  );
};

export default MovieDisk;
