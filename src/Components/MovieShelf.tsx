import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import MoviePoster from "./MoviePoster";
import { getBlogPostsSync } from "../Utils/functions";
import { media } from "../Utils/media";

type ShelfItem = {
  key: string;
  title: string;
  image?: string | null;
  to?: string | null;
  href?: string | null;
  /** A line from the film, shown as a subtitle while the poster is revealed. */
  note?: string | null;
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

/** Whether a media query matches, live. */
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(
    () => window.matchMedia?.(query).matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

/**
 * The touch stand-in for hover: on a screen with no hover (phones, tablets),
 * the poster at the row's left edge — lined up with the page — is treated as
 * hovered, and the role moves along as the row scrolls. A poster counts as at
 * the edge until more than half its visible strip has scrolled past it.
 * Null wherever there's a real hover.
 */
const useLeadingIndex = (rowRef: React.RefObject<HTMLDivElement | null>) => {
  const noHover = useMediaQuery("(hover: none)");
  const [leading, setLeading] = useState<number | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!noHover || !row) {
      setLeading(null);
      return;
    }

    const update = () => {
      const edge =
        row.getBoundingClientRect().left +
        parseFloat(getComputedStyle(row).paddingLeft);
      for (const el of row.querySelectorAll<HTMLElement>("[data-index]")) {
        const left = el.getBoundingClientRect().left;
        const next = el.nextElementSibling?.getBoundingClientRect().left;
        const strip = next != null ? next - left : el.offsetWidth;
        if (left + strip / 2 >= edge) {
          setLeading(Number(el.dataset.index));
          return;
        }
      }
    };

    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [noHover, rowRef]);

  return leading;
};

/** How many copies of a row are laid end to end so it can loop. */
const COPIES = 3;

/**
 * Makes a row loop: it holds COPIES identical copies of its posters and starts
 * on the middle one. Whenever the scroll drifts a half copy past either end of
 * the middle stretch it jumps back by exactly one copy's width — the content
 * there is identical, so the jump can't be seen, and the row never ends.
 */
const useLoopScroll = (
  rowRef: React.RefObject<HTMLDivElement | null>,
  listRef: React.RefObject<HTMLDivElement | null>,
  count: number,
) => {
  useLayoutEffect(() => {
    const row = rowRef.current;
    const list = listRef.current;
    if (!row || !list || count === 0) return;

    // One copy's width: from a poster to the same poster in the next copy
    // (overlaps included, so it's measured rather than summed).
    const measure = () => {
      const a = list.children[0] as HTMLElement | undefined;
      const b = list.children[count] as HTMLElement | undefined;
      return a && b ? b.offsetLeft - a.offsetLeft : 0;
    };

    let copy = measure();
    row.scrollLeft = copy; // start on the middle copy

    const onScroll = () => {
      if (!copy) return;
      if (row.scrollLeft < copy * 0.5) {
        row.scrollLeft += copy;
      } else if (row.scrollLeft > copy * 1.5) {
        row.scrollLeft -= copy;
      }
    };

    // Poster sizes step at breakpoints; keep the same place in the loop.
    const ro = new ResizeObserver(() => {
      const at = copy ? row.scrollLeft / copy : 1;
      copy = measure();
      row.scrollLeft = at * copy;
    });
    ro.observe(list);
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      row.removeEventListener("scroll", onScroll);
    };
  }, [rowRef, listRef, count]);
};

/**
 * Wheel events closer together than this belong to one gesture. A spun wheel
 * and a trackpad's momentum both send them far faster; a pause to start a new
 * scroll runs longer.
 */
const GESTURE_GAP_MS = 200;

/** Share of the distance still to go that the row covers each 60th of a second. */
const WHEEL_EASE = 0.18;

/**
 * Turns the mouse wheel's up and down into the row's left and right while the
 * cursor is over it, so the posters scroll instead of the page.
 *
 * The wheel doesn't move the row directly: a notch is ~100px at once, and
 * trackpad events don't land in step with the screen, so either way the row
 * would lurch. Instead the input is banked and paid out a share per frame,
 * easing to a stop.
 *
 * A gesture stays with wherever it started, though. The row spans the screen
 * and never ends, so if it took every wheel event over it, scrolling down the
 * page would stop dead the moment the row reached the cursor (momentum
 * included). Instead the page keeps that gesture; pause, scroll again, and it
 * goes to the row. Sideways input (a trackpad swipe) the row handles natively,
 * and pinch-zoom (ctrl + wheel) is left alone.
 */
const useWheelScroll = (rowRef: React.RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let lastAt = -Infinity;
    let rowOwns = false;

    let pending = 0; // wheel input not yet scrolled, in pixels
    let pos = 0; // where the row should be, unrounded
    let landed = 0; // where the browser put it, read back after each frame
    let raf = 0;
    let lastFrame = 0;

    // Moves by steps rather than to a target: useLoopScroll jumps the row back
    // a copy now and then, and anything else that moves it (that jump, a
    // swipe, a drag) shows up as a gap between where it is and where it
    // landed, which `pos` follows.
    const frame = (now: number) => {
      pos += row.scrollLeft - landed;
      const dt = lastFrame ? Math.min(now - lastFrame, 100) : 1000 / 60;
      lastFrame = now;
      const share = 1 - Math.pow(1 - WHEEL_EASE, dt / (1000 / 60));
      const step = Math.abs(pending) < 0.5 ? pending : pending * share;
      pending -= step;
      pos += step;
      row.scrollLeft = pos;
      landed = row.scrollLeft;
      if (pending) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        lastFrame = 0;
      }
    };

    // Sees every wheel event on the page, in the capture phase so it runs
    // before the row's own listener: the first event of a gesture decides
    // who owns it.
    const onAnyWheel = (e: WheelEvent) => {
      if (e.timeStamp - lastAt > GESTURE_GAP_MS)
        rowOwns = row.contains(e.target as Node);
      lastAt = e.timeStamp;
    };

    const onRowWheel = (e: WheelEvent) => {
      if (!rowOwns || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX))
        return;
      e.preventDefault();
      // Wheels that count in lines or pages, in pixels.
      const unit =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 40
          : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? row.clientWidth
            : 1;
      pending += e.deltaY * unit;
      if (!raf) {
        pos = landed = row.scrollLeft;
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener("wheel", onAnyWheel, {
      capture: true,
      passive: true,
    });
    // Not passive, so it can stop the page scrolling.
    row.addEventListener("wheel", onRowWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onAnyWheel, { capture: true });
      row.removeEventListener("wheel", onRowWheel);
    };
  }, [rowRef]);
};

// One row of posters, dealt out like a hand of cards: each one tucks under
// the next, and hovering one slides it out from under so it shows in full —
// on touch, the poster at the left edge gets that treatment as the row scrolls,
// lifted above the rest instead of slid (see useLeadingIndex).
// The row scrolls sideways and loops, so it never runs out (see useLoopScroll);
// over it, the mouse wheel scrolls it rather than the page (see useWheelScroll).
// Positions below count across all the copies; `% items.length` gives the film.
//
// The subtitle (the film's note) follows the mouse only — phones and tablets
// show the leading poster without it.
const PosterRow = ({ items }: { items: ShelfItem[] }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hovered = useHoveredIndex(rowRef);
  const leading = useLeadingIndex(rowRef);
  useLoopScroll(rowRef, listRef, items.length);
  useWheelScroll(rowRef);
  const total = items.length * COPIES;

  const note = hovered != null ? items[hovered % items.length]?.note : null;

  return (
    <div className="mb-6">
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
        <div ref={listRef} className="flex w-max isolate">
          {Array.from({ length: total }, (_, i) => {
            const item = items[i % items.length];
            const copy = Math.floor(i / items.length);
            // Only the middle copy is the "real" list for screen readers and
            // the keyboard; the others are there to be scrolled into.
            const duplicate = copy !== Math.floor(COPIES / 2);
            const isHovered = hovered === i;
            const isLeading = leading === i;
            return (
              <div
                key={`${copy}-${item.key}`}
                data-index={i}
                aria-hidden={duplicate || undefined}
                // Later posters sit on top of earlier ones. On hover a poster
                // slides left past the overlap (plus a small gap), out from
                // under the next one, so it shows in full while the rest of the
                // row stays put. Only the inner poster moves: the wrapper is
                // the hover target and stays where it is, so the poster can't
                // slide out from under the cursor and flicker. The last poster
                // has nothing on top of it, so it stays where it is. On touch the
                // leading poster doesn't slide — at the row's left edge that
                // would push it off the screen — it's lifted above the rest.
                // Stacking counts across the copies, so the seams between them
                // overlap like the rest of the row.
                style={{ zIndex: isLeading ? total : i }}
                className="shrink-0 -ml-16 sm:-ml-20 lg:-ml-24 first:ml-0"
              >
                <div
                  className={`transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isHovered && i < total - 1
                      ? "-translate-x-18 sm:-translate-x-22 lg:-translate-x-26"
                      : ""
                  }`}
                >
                  <MoviePoster
                    src={item.image}
                    title={item.title}
                    to={item.to}
                    href={item.href}
                    tabIndex={duplicate ? -1 : undefined}
                    // The hovered (or leading) poster gets a soft marquee-gold glow.
                    className={`w-24 sm:w-32 lg:w-36 transition-shadow duration-300 ${
                      isHovered || isLeading
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

// The movies on the home page: what's been watched, from media.json in its
// order. A film links to its review when there is one, otherwise to its TMDB
// page; reviews that aren't listed in media.json still go on the end of the
// row.
const MovieShelf = () => {
  const watched = useMemo<ShelfItem[]>(() => {
    const reviews = getBlogPostsSync().filter((p) => p.tags === "Movie");
    const reviewImage = new Map(reviews.map((p) => [p.slug, p.image]));
    const listed = new Set(media.movies.watched.map((m) => m.post));

    return [
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
  }, []);

  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.2em] text-available mb-2">
        Movies I recommend
      </div>
      <PosterRow items={watched} />
    </section>
  );
};

export default MovieShelf;
