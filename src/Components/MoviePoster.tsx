import { Link } from "react-router-dom";
import { BlogPostMeta } from "../Utils/markdownLoader";

type Props = {
  post: BlogPostMeta;
  /** Poster width in px; height follows the artwork's own proportions. */
  width?: number;
  /** Where the poster links. `null` for an unwatched entry with no review. */
  to?: string | null;
  /** Off for the small standalone uses (reader header, dock pile). */
  hoverPop?: boolean;
  /**
   * Wall mode: the poster fills a cell of exactly this height, cropping the
   * artwork rather than keeping its own proportions, so posters tile with no
   * seams and the wall can size a film by its score. Left off elsewhere, where
   * a poster stands alone and should keep its true shape.
   */
  height?: number;
};

/**
 * A film's poster, rendered plain — no frame, no chrome, no tilt. On a wall of
 * these the hover is the only movement: the poster lifts and pops forward over
 * its neighbours. Nothing labels it on screen, so the wall reads as artwork;
 * the title lives in the image's `alt` for screen readers, deliberately not in
 * a `title` — that would pop a browser tooltip over the art.
 */
const MoviePoster = ({
  post,
  width = 120,
  to = `/archive/${post.slug}`,
  hoverPop = true,
  height,
}: Props) => {
  // A cell in the wall is filled exactly; a poster on its own keeps the
  // artwork's own proportions.
  const cell = height
    ? {
        height,
        // Tiles sit at fractional pixel offsets, so a hairline of background
        // can otherwise show through the seams. Painting the artwork a whisker
        // larger than its box closes them without touching the layout — it's
        // already cropped, so nothing is lost.
        transform: "scale(1.004)",
      }
    : undefined;

  const art = post.image ? (
    <img
      src={post.image}
      alt={post.title}
      draggable={false}
      className={height ? "block w-full object-cover" : "block w-full h-auto"}
      style={cell}
    />
  ) : (
    // No artwork: a plain sheet carrying the title, so the wall never gaps.
    <div
      className="flex items-center justify-center bg-[#1b1a18] p-2 text-center"
      style={cell ?? { aspectRatio: "2 / 3" }}
    >
      <span className="font-display font-bold text-editorial-text/75 leading-tight text-[11px]">
        {post.title}
      </span>
    </div>
  );

  // Transform and shadow only — no filter animation, which is what makes a wall
  // of large images feel heavy on hover. Coming in, the curve overshoots and
  // settles back (the bounce); going out it's a plain glide, since a poster
  // springing on its way *down* reads as a glitch rather than as weight.
  const inner = hoverPop ? (
    <div
      className="relative w-full transform-gpu
        transition-[transform,box-shadow] duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)]
        group-hover/poster:duration-[900ms] group-hover/poster:ease-[cubic-bezier(0.34,1.44,0.5,1)]
        group-hover/poster:scale-[1.08] group-hover/poster:-translate-y-2
        group-hover/poster:shadow-[0_26px_50px_-18px_rgba(0,0,0,0.95)]"
      style={{ willChange: "transform", backfaceVisibility: "hidden" }}
    >
      {art}
    </div>
  ) : (
    art
  );

  // The wrapper keeps its layout box while the poster inside scales, so a pop
  // overlaps its neighbours instead of pushing the row around.
  const className = `group/poster block shrink-0 relative ${
    hoverPop ? "hover:z-10" : ""
  }`;

  return to ? (
    <Link to={to} className={className} style={{ width }} aria-label={post.title}>
      {inner}
    </Link>
  ) : (
    <div className={className} style={{ width }}>
      {inner}
    </div>
  );
};

export default MoviePoster;
