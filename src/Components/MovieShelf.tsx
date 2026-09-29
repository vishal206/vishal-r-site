import { useEffect, useMemo, useRef, useState } from "react";
import MoviePoster from "./MoviePoster";
import { getBlogPostsSync } from "../Utils/functions";
import { media } from "../Utils/media";
import type { MediaMovie } from "../Utils/media";

type ShelfItem = {
  key: string;
  title: string;
  image?: string | null;
  to?: string | null;
  href?: string | null;
  /**
   * Shown as a subtitle while the poster is revealed: a line from the film
   * (watched), or its rating, genres and running time (wishlist).
   */
  note?: string | null;
};

/** "1h 54m", "23m". */
const duration = (minutes: number) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`
    : `${minutes}m`;

/**
 * A wishlist film's facts as one subtitle line — "★ 7.2 · Horror · 1h 54m".
 * Two genres at most, to keep it to a line; a series gives its episodes
 * ("11 × 23m") in place of a running time. Null when there's nothing to say.
 */
const factsLine = (m: MediaMovie) => {
  const runtime =
    m.runtime != null
      ? m.episodes
        ? `${m.episodes} × ${duration(m.runtime)}`
        : duration(m.runtime)
      : null;
  const parts = [
    m.rating != null ? `★ ${m.rating.toFixed(1)}` : null,
    m.genres?.length ? m.genres.slice(0, 2).join(", ") : null,
    runtime,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
};

/** A note as plain words: subtitles aren't italic, so markdown marks go. */
const plainNote = (note: string) => note.replace(/[*_`]/g, "").trim();

/**
 * The revealed film's note as a classic subtitle on the device's screen: bold
 * yellow type in a thin black outline, fixed and centred near the bottom of
 * the viewport (clear of a phone's home indicator), whatever part of the page
 * is in view. It keeps its last line while fading out, so it doesn't blank
 * mid-fade.
 */
const Subtitle = ({ note }: { note?: string | null }) => {
  const [shown, setShown] = useState(note ?? "");
  useEffect(() => {
    if (note) setShown(note);
  }, [note]);

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+7vh)] z-50 flex justify-center px-6 transition-opacity duration-200 ${
        note ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="max-w-[40rem] text-center font-[Arial,Helvetica,sans-serif] text-base sm:text-lg lg:text-xl font-bold leading-snug text-[#FFE500] line-clamp-2 [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,0_2px_6px_rgba(0,0,0,0.85)]">
        {shown && plainNote(shown)}
      </p>
    </div>
  );
};

/**
 * Which poster in a row the mouse is over, by index. Tracked by hand instead
 * of with CSS `:hover`, which browsers only update when the mouse moves: scroll
 * the row (or the page) under a resting cursor and `:hover` stays on the
 * poster that scrolled away. Here every scroll re-checks what's under the
 * cursor, so the poster that arrives there is the one highlighted.
 */
const useHoveredIndex = (rowRef: React.RefObject<HTMLDivElement | null>) => {
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    let pointer: { x: number; y: number } | null = null;

    const update = () => {
      const row = rowRef.current;
      const hit =
        pointer && row ? document.elementFromPoint(pointer.x, pointer.y) : null;
      const poster =
        hit && row?.contains(hit)
          ? hit.closest<HTMLElement>("[data-index]")
          : null;
      setHovered(poster ? Number(poster.dataset.index) : null);
    };

    // Mouse only: a touch has no hover, and taps shouldn't leave one behind.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      update();
    };
    // The cursor left the window.
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      pointer = null;
      update();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut);
    // Scroll doesn't bubble; capturing catches the row's and the page's alike.
    document.addEventListener("scroll", update, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      document.removeEventListener("scroll", update, { capture: true });
    };
  }, [rowRef]);

  return hovered;
};

/**
 * The touch stand-in for hover: which poster in a row was tapped, by index. A
 * first tap on a poster shows it in full instead of opening it; a second tap
 * on the same poster follows its link. A tap anywhere else clears it. Mouse
 * clicks are left alone — a mouse has real hover.
 */
const useTappedIndex = (rowRef: React.RefObject<HTMLDivElement | null>) => {
  const [tapped, setTapped] = useState<number | null>(null);
  const lastPointer = useRef<string>("mouse");

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      lastPointer.current = e.pointerType;
      // A tap outside this row's posters clears the selection.
      const poster = (e.target as Element | null)?.closest?.("[data-index]");
      if (!poster || !rowRef.current?.contains(poster)) setTapped(null);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, [rowRef]);

  /** Click capture for a poster: holds a first tap back from the link. */
  const onPosterClick = (i: number) => (e: React.MouseEvent) => {
    if (lastPointer.current === "mouse" || tapped === i) return;
    e.preventDefault();
    setTapped(i);
  };

  return { tapped, onPosterClick };
};

// One row of posters, dealt out like a hand of cards: each one tucks under
// the next, and hovering one slides it out from under so it shows in full —
// on touch, tapping one lifts it above the rest instead (see useTappedIndex).
// The row scrolls sideways when it runs past the screen.
const PosterRow = ({ label, items }: { label: string; items: ShelfItem[] }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const hovered = useHoveredIndex(rowRef);
  const { tapped, onPosterClick } = useTappedIndex(rowRef);
  const revealed = hovered ?? tapped;
  const note = revealed != null ? items[revealed]?.note : null;

  return (
    <div className="mb-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-label mb-1">
        {label} <span className="text-editorial-muted">· {items.length}</span>
      </div>
      {/* Bleeds out to both edges of the screen so the row scrolls edge to
          edge, while the padding puts the first poster back in line with the
          page. Vertical padding leaves room for the shadow and hover glow,
          which the scroller would otherwise clip. */}
      <div
        ref={rowRef}
        className="overflow-x-auto overflow-y-hidden mx-[calc(50%-50vw)] px-[calc(50vw-50%)] pt-6 pb-8"
      >
        {/* `isolate` keeps the posters' z-indexes (one per poster, up past
            the section sheet's) stacked inside the row instead of against the
            rest of the page, where they'd show through an open section. */}
        <div className="flex w-max isolate">
          {items.map((item, i) => {
            const isHovered = hovered === i;
            const isTapped = tapped === i;
            return (
              <div
                key={item.key}
                data-index={i}
                onClickCapture={onPosterClick(i)}
                // Later posters sit on top of earlier ones. On hover a poster
                // slides left past the overlap (plus a small gap), out from
                // under the next one, so it shows in full while the rest of the
                // row stays put. Only the inner poster moves: the wrapper is
                // the hover target and stays where it is, so the poster can't
                // slide out from under the cursor and flicker. The last poster
                // has nothing on top of it, so it stays where it is. A tapped
                // poster doesn't slide — at the row's left edge that would push
                // it off a narrow screen — it's lifted above the rest instead.
                style={{ zIndex: isTapped ? items.length : i }}
                className="shrink-0 -ml-16 sm:-ml-20 lg:-ml-24 first:ml-0"
              >
                <div
                  className={`transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isHovered && i < items.length - 1
                      ? "-translate-x-18 sm:-translate-x-22 lg:-translate-x-26"
                      : ""
                  }`}
                >
                  <MoviePoster
                    src={item.image}
                    title={item.title}
                    to={item.to}
                    href={item.href}
                    // The hovered (or tapped) poster gets a soft marquee-gold glow.
                    className={`w-24 sm:w-32 lg:w-36 transition-shadow duration-300 ${
                      isHovered || isTapped
                        ? "shadow-[0_0_18px_2px_rgba(245,185,66,0.45),0_10px_24px_-8px_rgba(0,0,0,0.85)]!"
                        : ""
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Subtitle note={note} />
    </div>
  );
};

// The movies on the home page: what's been watched, then what's next. Both
// lists come from media.json in its order. A watched film links to its review
// when there is one, otherwise to its TMDB page; reviews that aren't listed in
// media.json still go on the end of the watched row.
const MovieShelf = () => {
  const { watched, wishlist } = useMemo(() => {
    const reviews = getBlogPostsSync().filter((p) => p.tags === "Movie");
    const reviewImage = new Map(reviews.map((p) => [p.slug, p.image]));
    const listed = new Set(media.movies.watched.map((m) => m.post));

    const watched: ShelfItem[] = [
      ...media.movies.watched.map((m, i) => ({
        key: `watched-${i}`,
        title: m.title,
        // A reviewed film may keep its poster on the post rather than here.
        image: m.image ?? (m.post ? reviewImage.get(m.post) : null),
        to: m.post ? `/article/${m.post}` : null,
        href: m.post ? null : m.url,
        note: m.note,
      })),
      ...reviews
        .filter((p) => !listed.has(p.slug))
        .map((p) => ({
          key: `review-${p.slug}`,
          title: p.title,
          image: p.image,
          to: `/article/${p.slug}`,
        })),
    ];

    const wishlist: ShelfItem[] = media.movies.wishlist.map((m, i) => ({
      key: `wishlist-${i}`,
      title: m.title,
      image: m.image,
      href: m.url,
      note: factsLine(m),
    }));

    return { watched, wishlist };
  }, []);

  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.2em] text-available mb-2">
        Movies I watch
      </div>
      <PosterRow label="Watched" items={watched} />
      <PosterRow label="Wishlist" items={wishlist} />
    </section>
  );
};

export default MovieShelf;
