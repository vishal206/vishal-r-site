import { useEffect, useState } from "react";
import type { Book as BookType } from "../Utils/markdownLoader";
import BookCover from "./BookCover";

type Props = {
  book: BookType;
  /** Box height in px. Pass {base, md} for a smaller size below the md breakpoint. */
  height: number | { base: number; md: number };
  /** Resting rotation in degrees — how far the book is turned toward its corner. */
  tiltDeg?: number;
  className?: string;
};

/**
 * A real 3D book seen from its front-left corner: the front cover angled to the
 * right and the spine (the `side` image) standing on the left, joined at a
 * shared vertical edge. Built with CSS 3D transforms — no flat illustration.
 */
const Book3D = ({ book, height, tiltDeg = 34, className = "" }: Props) => {
  const [ratio, setRatio] = useState(2 / 3); // cover width ÷ height
  const [sideRatio, setSideRatio] = useState<number | null>(null); // spine w ÷ h
  const [hovered, setHovered] = useState(false);
  const [resolvedH, setResolvedH] = useState(
    typeof height === "number" ? height : height.base,
  );

  useEffect(() => {
    if (typeof height === "number") {
      setResolvedH(height);
      return;
    }
    const update = () =>
      setResolvedH(window.innerWidth < 768 ? height.base : height.md);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [height]);

  useEffect(() => {
    if (!book.cover) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive && img.naturalHeight)
        setRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = book.cover;
    return () => {
      alive = false;
    };
  }, [book.cover]);

  useEffect(() => {
    if (!book.side) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive && img.naturalHeight)
        setSideRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = book.side;
    return () => {
      alive = false;
    };
  }, [book.side]);

  const H = resolvedH;
  const W = Math.round(H * ratio);
  // Spine thickness fits the side image's aspect ratio at the book height, so
  // the whole spine shows uncropped. Falls back to a plain thickness otherwise.
  const D =
    book.side && sideRatio
      ? Math.min(Math.max(Math.round(H * sideRatio), 12), Math.round(W * 0.5))
      : Math.max(14, Math.round(W * 0.16));
  const accent = book.accent ?? "#333";
  const rot = hovered ? tiltDeg - 12 : tiltDeg;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{
        width: W + D,
        height: H,
        perspective: Math.max(1000, H * 3),
        perspectiveOrigin: "60% 50%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* The book — rotated so we look at its front-left corner. */}
      <div
        className="absolute top-0"
        style={{
          left: D,
          width: W,
          height: H,
          transformStyle: "preserve-3d",
          transform: `rotateY(${rot}deg) translateY(${hovered ? -4 : 0}px)`,
          transition: "transform 500ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Front cover (front face) */}
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
          <BookCover book={book} />
          {/* Crisp fold: a thin hard shadow right at the binding edge. */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none"
            style={{
              width: Math.max(3, Math.round(W * 0.03)),
              background:
                "linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.28) 40%, transparent)",
            }}
          />
        </div>

        {/* Spine — hinged at the cover's left edge, standing back at 90°. */}
        <div
          className="absolute top-0 overflow-hidden"
          style={{
            width: D,
            height: H,
            left: -D,
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
            background: book.side ? "#0e0e0e" : accent,
          }}
        >
          {book.side ? (
            <img
              src={book.side}
              alt=""
              draggable={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center px-0.5">
              <span
                className="font-display font-bold text-white/85 text-center overflow-hidden"
                style={{
                  writingMode: "vertical-rl",
                  fontSize: Math.max(8, Math.round(D * 0.5)),
                  maxHeight: "92%",
                }}
              >
                {book.title}
              </span>
            </div>
          )}
          {/* Flat, uniform shade so the spine reads as one distinct plane —
              its bright edge meets the cover at a hard corner, not a blend. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "rgba(0,0,0,0.34)" }}
          />
          {/* Thin sheen on the outer (page-block) edge. */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none"
            style={{
              width: 2,
              background: "rgba(255,255,255,0.14)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Book3D;
