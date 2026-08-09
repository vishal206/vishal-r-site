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
  /**
   * A line worth keeping from the film — usually a bit of dialogue. Shows
   * along the bottom of the poster on hover, and only then, so the wall stays
   * artwork until you look at something. Optional: without it the hover is
   * just the frame.
   */
  note?: string | null;
};

/**
 * A film's poster, rendered plain — no frame, no chrome, no tilt. On a wall of
 * these the hover is the only movement: the poster lifts and pops forward over
 * its neighbours, picks up a stone-white frame, and shows its `note` if it has
 * one. Nothing labels it at rest, so the wall reads as artwork; the title
 * lives in the image's `alt` for screen readers, deliberately not in a `title`
 * — that would pop a browser tooltip over the art.
 */
const MoviePoster = ({
  post,
  width = 120,
  to = `/archive/${post.slug}`,
  hoverPop = true,
  height,
  note,
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

  // The frame and the note, both held back until hover. One layer carries the
  // pair so they arrive together, and it sits inside the scaling wrapper so the
  // frame tracks the poster's edge as it grows. `pointer-events-none` keeps it
  // out of the way of the link underneath.
  //
  // The frame is heavy on purpose — a painting in a gallery, not a CSS
  // outline. It's a share of the poster's width rather than a fixed number of
  // pixels, so the small posters on the wall get the same look as the big ones
  // instead of a hairline. Flat opaque white the whole way through: no inner
  // line, no shadow, nothing darker anywhere against the art.
  const frame = Math.round(Math.min(24, Math.max(10, width * 0.075)));

  // The foot of the mount is always deeper than the other three sides — that's
  // how a picture is actually mounted, and it's what stops the frame reading as
  // a plain box. Where there's a note it deepens further, enough to hold two
  // lines, so the label sits under the picture rather than on it. Both the type
  // and the plate scale with the poster, so a narrow one doesn't end up with
  // unreadable type or a plate that swamps the art.
  const ink = Math.round(Math.min(13, Math.max(9, width * 0.05)));
  const plate = Math.max(
    Math.round(frame * 1.9),
    note ? Math.round(ink * 4.4) : 0,
  );

  const overlay = (
    <div
      aria-hidden
      className="pointer-events-none absolute
        opacity-0 transition-opacity duration-300 ease-out
        group-hover/poster:opacity-100"
      style={{
        // Hung *around* the poster, not over it: the offsets put the frame's
        // inner edge exactly on the artwork's edge, so the whole poster stays
        // visible and the mount takes its space from the neighbours instead.
        // The lifted poster is already raised above them, so it sits on top.
        top: -frame,
        left: -frame,
        right: -frame,
        bottom: -plate,
        border: `${frame}px solid #f2efe9`,
        borderBottomWidth: plate,
      }}
    >
      {note ? (
        // Sits over the plate the border already paints — an absolutely
        // positioned child is laid out against the padding box, so the
        // negative offset is what carries it out onto the frame itself and
        // leaves the artwork above it uncovered.
        <span
          className="absolute inset-x-0 flex items-center justify-center px-1.5"
          style={{ bottom: -plate, height: plate }}
        >
          <span
            className="text-center font-body text-editorial-bg line-clamp-2"
            style={{ fontSize: ink, lineHeight: 1.3 }}
          >
            {note}
          </span>
        </span>
      ) : null}
    </div>
  );

  // Transform only — no shadow, and no filter animation. The lift used to cast
  // a heavy drop shadow, but a wide blur at near-black rings the frame on every
  // side and reads as a dark border around the white; the frame is the whole
  // effect now. Coming in, the curve overshoots and settles back (the bounce);
  // going out it's a plain glide, since a poster springing on its way *down*
  // reads as a glitch rather than as weight.
  const inner = hoverPop ? (
    <div
      className="relative w-full transform-gpu
        transition-transform duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)]
        group-hover/poster:duration-[900ms] group-hover/poster:ease-[cubic-bezier(0.34,1.44,0.5,1)]
        group-hover/poster:scale-[1.08] group-hover/poster:-translate-y-2"
      style={{ willChange: "transform", backfaceVisibility: "hidden" }}
    >
      {art}
      {overlay}
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
