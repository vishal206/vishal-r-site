import { useCallback, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { BlogPostMeta } from "../Utils/markdownLoader";
import { MOUNT_EDGE_COLOR, MOUNT_GAP, mountChrome } from "./posterMount";
import type { MountChrome } from "./posterMount";

// The hover pop's lift, as a number as well as a class: the nudge below has to
// predict where the poster will land before the transition runs, so this has
// to stay in step with the `-translate-y-2` on the inner element. The scale
// itself comes in as a prop (`popScale`) and reaches the class as a variable.
const LIFT = 8;

/** The pop a poster gets when nothing says otherwise. */
const DEFAULT_POP = 1.08;

/** How much bigger a mount's plate type may come out on hover, on screen. */
const PLATE_POP = 1.15;

/** A note as its words, with the markdown marks it carries stripped. */
const plainNote = (note: string) =>
  note
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();

/** How close the frame may come to the edge of the screen before it's moved. */
const EDGE = 6;

/** How far the card tilts, in degrees, with the cursor at a poster's edge. */
const TILT = 7;

type Props = {
  post: BlogPostMeta;
  /** Poster width in px; height follows the artwork's own proportions. */
  width?: number;
  /** Where the poster links, on this site. `null` for a poster that goes nowhere. */
  to?: string | null;
  /**
   * An off-site link — TMDB, for a wishlist film with no review of its own to
   * point at. Wins over `to`, and opens in a new tab: the wall is a place you
   * browse, and clicking a poster shouldn't cost you your place in it.
   */
  href?: string | null;
  /** Off for the small standalone uses (reader header, dock pile). */
  hoverPop?: boolean;
  /**
   * How much the poster grows on hover. The wall sets this per poster so the
   * popped poster comes out the same size on screen whatever the wall's zoom
   * — a quarter of the screen, say — rather than a fixed nudge up.
   */
  popScale?: number;
  /**
   * A strip along the bottom of the screen the popped poster must stay
   * clear of — the dock's, on the wall — since it's painted in a layer above
   * the poster and would cover it.
   */
  safeBottom?: number;

  /**
   * Wall mode: the poster fills a cell of exactly this height, so posters
   * tile with no seams. The wall cuts its cells to the poster's own 2:3, so
   * nothing is cropped. Left off elsewhere, where a poster stands alone and
   * sizes itself from its width.
   */
  height?: number;
  /**
   * A line worth keeping from the film — usually a bit of dialogue. Shows
   * along the bottom of the poster on hover, and only then, so the wall stays
   * artwork until you look at something. Markdown, so it can carry its own
   * emphasis (`*like this*`). Optional: without it the hover is just the frame.
   */
  note?: string | null;
  /**
   * What to set on the mount plate instead of a `note` — the wishlist wall's
   * facts (see PosterCaption). Passing it hangs the frame on hover exactly as
   * a note does, so a film with something to say gets the same treatment
   * whether that's a line of dialogue or its running time.
   */
  caption?: ReactNode;
  /**
   * Hang the picture in its mount permanently rather than on hover.
   *
   * The hover frame is drawn *around* the poster, overlapping the neighbours
   * it's briefly raised above — fine for one poster at a time, impossible for
   * a whole wall of them at once. A mounted poster takes the frame and the
   * plate out of its own cell instead, so the artwork is what's left over and
   * the mounts tile against each other exactly as bare posters did.
   *
   * Wall mode only: without a `height` there's no cell to take them out of.
   */
  mounted?: boolean;
  /**
   * The frame/plate measurements to hang by, when a wall has worked them out
   * for every one of its mounts at once. Left off, a poster sizes its own from
   * its width — which is what the hover frame does, since those posters are
   * each a different width and are only ever seen one at a time.
   */
  chrome?: MountChrome;
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
  href,
  hoverPop = true,
  popScale = DEFAULT_POP,
  safeBottom = 0,
  height,
  note,
  caption,
  mounted = false,
  chrome,
}: Props) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const [nudge, setNudge] = useState<{ x: number; y: number } | null>(null);

  // The tilt and the sheen follow the cursor across the poster: two angles
  // and a highlight position, written straight to the poster's root as
  // variables (no render per move — this runs at pointer rate). The 3D
  // transform does cost the pop its sharpness on the way up — the browser
  // rasters the poster at its resting size until the spring settles — and
  // that's accepted for the feel of the card.
  const onTiltMove = useCallback((e: React.PointerEvent) => {
    const el = rootRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * TILT).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * TILT).toFixed(2)}deg`);
    el.style.setProperty("--sx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--sy", `${((py + 0.5) * 100).toFixed(1)}%`);
  }, []);
  const onTiltLeave = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  // The frame is heavy on purpose — a painting in a gallery, not a CSS outline.
  // Flat opaque white the whole way through: no inner line, no shadow, nothing
  // darker anywhere against the art. The foot is deeper than the other three
  // sides, as a mount actually is, and that depth is what holds the label.
  // A mount stands its gap off its neighbours, so anything it has to size for
  // itself is set against what's left of the cell rather than the whole of it.
  const { gap, edge, frame, ink, plate } =
    chrome ?? mountChrome(mounted ? width - MOUNT_GAP : width);

  // A cell in the wall is filled exactly; a poster on its own keeps the
  // artwork's own proportions. Mounted, the gap, the edge, the frame and the
  // plate are taken off the cell first and the artwork gets what's left.
  const artHeight =
    height && mounted
      ? Math.max(1, height - gap - 2 * edge - frame - plate)
      : height;

  const cell = artHeight
    ? {
        height: artHeight,
        // Tiles sit at fractional pixel offsets, so a hairline of background
        // can otherwise show through the seams. Painting the artwork a whisker
        // larger than its box closes them without touching the layout — it's
        // already cropped, so nothing is lost. A mounted poster has a frame
        // between it and its neighbours, so it has no seams to close and would
        // only bleed over its own mount.
        transform: mounted ? undefined : "scale(1.004)",
      }
    : undefined;

  const art = post.image ? (
    <img
      src={post.image}
      alt={post.title}
      draggable={false}
      className={
        artHeight
          ? // The wall sizes every cell to the standard 2:3 sheet, so `cover`
            // has nothing to crop — it's here so a poster that isn't quite the
            // standard sheet fills its cell rather than letterboxing, which
            // would show the wall (or the mount) through.
            "block w-full object-cover"
          : "block w-full h-auto"
      }
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

  // What's set on the plate under the picture: the wishlist's facts where it
  // has them, the film's own note otherwise.
  const label =
    caption ??
    (note ? (
      <span
        className="text-center font-body text-editorial-mount-ink line-clamp-2"
        style={{ fontSize: ink, lineHeight: 1.3 }}
      >
        {/* Markdown, so a note can carry its own emphasis — but rendered
            inline: the clamp needs the text as direct children, and a block
            <p> here would also break the centring. Links are flattened to
            their text, since the whole poster is already a link and one can't
            sit inside another. */}
        <ReactMarkdown
          components={{
            p: ({ children }) => <>{children}</>,
            a: ({ children }) => <>{children}</>,
          }}
        >
          {note}
        </ReactMarkdown>
      </span>
    ) : null);

  // The frame and the label, both held back until hover. One layer carries the
  // pair so they arrive together, and it sits inside the scaling wrapper so the
  // frame tracks the poster's edge as it grows. `pointer-events-none` keeps it
  // out of the way of the link underneath.
  //
  // Only a film with something to say gets a frame: it exists to carry what's
  // below the picture, so a poster with nothing to put there just pops, and
  // the wall stays artwork. A mounted poster is already framed and skips this
  // entirely — its frame is in the layout, not hung over it.
  const framed = hoverPop && Boolean(label) && !mounted;

  // A poster at the edge of the screen would pop off it, so the pop moves
  // inward by however much won't fit. Worked out from where the poster is
  // *about* to land — the transition hasn't run yet at this point — and
  // applied to the same element that scales, so the poster's own hit box
  // never moves out from under the cursor and the hover can't flicker.
  const measure = useCallback(() => {
    const el = rootRef.current;
    if (!el || !hoverPop) return;
    const r = el.getBoundingClientRect();
    const halfW = r.width / 2;
    const halfH = r.height / 2;
    // The wall may be zoomed (CSS `zoom`), which scales a transform inside
    // it along with everything else; the rect is in screen px, so the shift
    // has to be divided back out of the zoom as well as the pop.
    const zoom = el.offsetWidth ? r.width / el.offsetWidth : 1;
    const cx = r.left + halfW;
    const cy = r.top + halfH - LIFT * zoom;

    // How far off the screen the popped poster (frame included, where it
    // hangs one) would land, brought back by exactly that much. `transform`
    // composes inside the scale, so the shift is divided back out of it.
    const shift = (low: number, high: number, limit: number) =>
      (Math.max(0, EDGE - low) - Math.max(0, high - (limit - EDGE))) /
      (popScale * zoom);

    const fx = framed ? frame * zoom : 0;
    const fy = framed ? plate * zoom : 0;
    const x = shift(
      cx - (halfW + fx) * popScale,
      cx + (halfW + fx) * popScale,
      window.innerWidth,
    );
    const y = shift(
      cy - (halfH + fx) * popScale,
      cy + (halfH + fy) * popScale,
      window.innerHeight - safeBottom,
    );

    setNudge(x || y ? { x, y } : null);
  }, [hoverPop, framed, frame, plate, popScale, safeBottom]);

  const overlay = framed ? (
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
        border: `${frame}px solid var(--color-editorial-mount, #e3e0da)`,
        borderBottomWidth: plate,
      }}
    >
      {/* Sits over the plate the border already paints — an absolutely
          positioned child is laid out against the padding box, so the negative
          offset is what carries it out onto the frame itself and leaves the
          artwork above it uncovered. */}
      <span
        className="absolute inset-x-0 flex items-center justify-center px-1.5"
        style={{ bottom: -plate, height: plate }}
      >
        {label}
      </span>
    </div>
  ) : null;

  // Hung for good: the cell *is* the mount, and the artwork sits inside it.
  // A black edge runs evenly round the outside; inside it the three even
  // sides come off as padding and the deeper foot is the plate, so edge +
  // frame + artwork + plate + edge adds back to exactly the cell's height and
  // a wall of these tiles as tightly as a wall of bare posters.
  //
  // With no plate (a watched film's mount is the black edge alone), whatever
  // the poster has to say is held back for the hover instead: a band along
  // the foot of the artwork, dark so the type reads over any picture, that
  // grows to the note rather than clipping it.
  //
  // The words come up one after another, from under the foot of the poster,
  // like a subtitle being set. The note is markdown, but only ever a line
  // of dialogue, so it's flattened to its words here and the emphasis kept
  // as a whole — a note wrapped in `*…*` is set in italics.
  const noteWords = note ? plainNote(note).split(/\s+/).filter(Boolean) : [];
  const noteItalic = Boolean(note && /^[*_].*[*_]$/s.test(note.trim()));
  const hoverNote =
    mounted && !plate && !caption && noteWords.length ? (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden px-2 pb-1.5 pt-6
          opacity-0 transition-opacity duration-300 ease-out group-hover/poster:opacity-100"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0))",
        }}
      >
        <span
          className={`text-center font-body text-editorial-text ${noteItalic ? "italic" : ""}`}
          style={{
            fontSize: Math.max(10, ink * 1.3),
            lineHeight: 1.3,
            overflowWrap: "anywhere",
          }}
        >
          {noteWords.map((word, i) => (
            <span
              key={i}
              className="poster-word"
              style={{ ["--i" as string]: String(i) }}
            >
              {word}
              {i < noteWords.length - 1 ? "\u00a0" : ""}
            </span>
          ))}
        </span>
      </span>
    ) : null;

  const picture =
    mounted && height ? (
      // The outer box still fills the cell exactly — it's transparent, and the
      // padding is what holds the mount off its neighbours.
      <div style={{ height, padding: gap / 2 }}>
        <div
          className="relative flex h-full flex-col overflow-hidden"
          style={{
            // Stone only where there's a frame or plate to be stone. A bare
            // mount paints nothing: at a fractional zoom the artwork can
            // fall a sub-pixel short of its box, and a painted box shows
            // through as a hairline along the foot.
            backgroundColor:
              frame || plate
                ? "var(--color-editorial-mount, #e3e0da)"
                : "transparent",
            border: `${edge}px solid ${MOUNT_EDGE_COLOR}`,
            padding: `${frame}px ${frame}px 0`,
          }}
        >
          {art}
          {plate > 0 && (
            <span
              className="flex shrink-0 items-center justify-center overflow-hidden px-1"
              style={{ height: plate }}
            >
              {/* The plate's type is held back as the poster pops: it's a
                  label, and blown up with the artwork it shouts. It comes
                  out a touch larger than at rest, no more. */}
              <span
                className="poster-plate flex max-w-full items-center justify-center"
                style={{
                  ["--plate-pop" as string]: String(PLATE_POP / popScale),
                }}
              >
                {label}
              </span>
            </span>
          )}
          {hoverNote}
          {/* The sheen is clipped to the mount: outside it the cell is
              only the gap to the neighbours, and a highlight there would
              read as a halo round the poster. */}
          {hoverPop && <span aria-hidden className="poster-sheen" />}
        </div>
      </div>
    ) : (
      art
    );

  // Transform only — no shadow, and no filter animation. The lift used to cast
  // a heavy drop shadow, but a wide blur at near-black rings the frame on every
  // side and reads as a dark border around the white; the frame is the whole
  // effect now. The timing lives in index.css (`.poster-pop`): a spring on
  // the way up, a glide on the way down. The scale is read off a variable
  // so the wall can set it per poster.
  const inner = hoverPop ? (
    <div
      className="poster-pop relative w-full transform-gpu
        group-hover/poster:scale-[var(--pop)] group-hover/poster:-translate-y-2"
      style={{
        ["--pop" as string]: String(popScale),
        transformOrigin: "center",
        // No `will-change` here: it pins the layer's raster at its resting
        // size, and a popped poster then stays soft. Left to the browser,
        // the layer is re-rastered once the spring settles, and it's crisp.
        // Scale and lift come from the classes above as their own `scale` and
        // `translate` properties, so this composes with them rather than
        // replacing them. `transition-transform` covers all three.
        transform: nudge
          ? `translate3d(${nudge.x.toFixed(1)}px, ${nudge.y.toFixed(1)}px, 0)`
          : undefined,
      }}
    >
      <div className="relative">
        {picture}
        {!mounted && <span aria-hidden className="poster-sheen" />}
      </div>
      {overlay}
    </div>
  ) : (
    picture
  );

  // The wrapper keeps its layout box while the poster inside scales, so a pop
  // overlaps its neighbours instead of pushing the row around.
  const className = `group/poster block shrink-0 relative ${
    hoverPop ? "poster-tilt hover:z-10" : ""
  }`;

  const bind = {
    className,
    "data-poster": hoverPop ? "" : undefined,
    style: { width },
    onMouseEnter: measure,
    onMouseLeave: () => {
      setNudge(null);
      onTiltLeave();
    },
    onPointerMove: hoverPop ? onTiltMove : undefined,
  };

  if (href)
    return (
      <a
        {...bind}
        ref={(el) => (rootRef.current = el)}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${post.title} — on The Movie Database`}
      >
        {inner}
      </a>
    );

  return to ? (
    <Link
      {...bind}
      ref={(el) => (rootRef.current = el)}
      to={to}
      aria-label={post.title}
    >
      {inner}
    </Link>
  ) : (
    <div {...bind} ref={(el) => (rootRef.current = el)}>
      {inner}
    </div>
  );
};

export default MoviePoster;
