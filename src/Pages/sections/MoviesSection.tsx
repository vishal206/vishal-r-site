import React, { useEffect, useMemo, useRef, useState } from "react";
import FilterBar from "../../components/FilterBar";
import MoviePoster from "../../components/MoviePoster";
import { usePointerPan } from "../../hooks/usePointerPan";
import { getBlogPostsSync } from "../../Utils/functions";
import type { BlogPostMeta } from "../../Utils/markdownLoader";
import { media } from "../../Utils/media";
import type { MediaMovie } from "../../Utils/media";

type Category = "reviewed" | "watched" | "wishlist";
type Filter = "all" | Category;

type Shelved = {
  post: BlogPostMeta;
  to: string | null;
  category: Category;
};

/** A media.json entry dressed as a blog post so MoviePoster can render it. */
const toPost = (m: MediaMovie): BlogPostMeta => ({
  slug: m.post ?? m.title,
  title: m.title,
  date: "",
  image: m.image ?? undefined,
  tags: "Movie",
  description: "",
});

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reviewed", label: "Reviewed" },
  { key: "watched", label: "Watched" },
  { key: "wishlist", label: "To Be Watched" },
];

// Posters come in four sizes so the cluster looks pinned up by hand rather than
// laid out on a grid. The size is keyed off the slug, so a film always gets the
// same one — no reshuffle on re-render or when the filter changes. Set this to
// a single value for a uniform wall.
const WIDTH_SCALES = [0.72, 0.86, 1, 1.16];

const slugHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const GAP = 10; // px between posters, both directions

/**
 * Poster size and how many columns the wall runs to, stepped by viewport. The
 * cluster is meant to run past the viewport — the wall clips it, so it reads as
 * a wall carrying on past the edges rather than a centred block.
 */
const wallScaleFor = (viewport: number) =>
  viewport >= 1280
    ? { width: 210, columns: 7 }
    : viewport >= 1024
      ? { width: 190, columns: 6 }
      : viewport >= 640
        ? { width: 165, columns: 5 }
        : { width: 124, columns: 4 };

const useWallScale = () => {
  const [scale, setScale] = useState(() => wallScaleFor(window.innerWidth));
  useEffect(() => {
    const onResize = () => setScale(wallScaleFor(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return scale;
};


// How far each column slides up or down from centre. Posters stay shoulder to
// shoulder horizontally, but nothing lines up across a column boundary — which
// is what stops the wall reading as rows.
const COLUMN_DRIFT = [-6, 26, -20, 12, 34, -14, 20, -28, 8];

// The drift is a transform, so it doesn't grow the block's layout box. Padding
// the block by the largest drift keeps the panning limits honest — otherwise
// the outermost drifted poster sits just past where the pan can reach.
const MAX_DRIFT = Math.max(...COLUMN_DRIFT.map(Math.abs));

/**
 * How many posters go in each column, left to right: the middle columns run
 * tallest and the outer ones are shorter, so the block as a whole tapers to a
 * rough rhombus. Derived from the count alone, so the shape re-forms itself as
 * films are added or the filter narrows the list.
 */
const columnPlan = (n: number, columns: number): number[] => {
  const cols = Math.max(1, Math.min(columns, n));
  if (cols <= 1) return n > 0 ? [n] : [];

  // Triangular weighting: the middle column is tallest, the outermost ~55% of
  // it. Exact counts come from sharing out `n` by those weights.
  const centre = (cols - 1) / 2;
  const weights = Array.from(
    { length: cols },
    (_, i) => 1 - 0.45 * (Math.abs(i - centre) / centre),
  );
  const total = weights.reduce((a, b) => a + b, 0);

  const raw = weights.map((w) => (w / total) * n);
  const plan = raw.map((r) => Math.floor(r));

  // Largest-remainder pass, so the columns always add up to exactly `n`.
  let left = n - plan.reduce((a, b) => a + b, 0);
  for (const { i } of raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)) {
    if (left === 0) break;
    plan[i] += 1;
    left -= 1;
  }

  // No holes in the wall: an empty column borrows from the tallest one.
  for (let i = 0; i < cols; i++) {
    if (plan[i] > 0) continue;
    const tallest = plan.indexOf(Math.max(...plan));
    if (plan[tallest] > 1) {
      plan[tallest] -= 1;
      plan[i] += 1;
    }
  }

  return plan.filter((size) => size > 0);
};

// ── Filter change choreography ───────────────────────────────────────────────
// The old set drops off the wall before the new set goes up, so the two never
// cross-fade through each other. Delays ripple out from the middle column.
const EXIT_MS = 220;
const ENTER_MS = 520;
const exitDelay = (spread: number, depth: number) =>
  Math.min(140, spread * 16 + depth * 10);
const enterDelay = (spread: number, depth: number) =>
  Math.min(420, spread * 42 + depth * 28);

/** Splits the list into the columns described by `columnPlan`. */
const toColumns = <T,>(items: T[], columns: number): T[][] => {
  const grouped: T[][] = [];
  let cursor = 0;
  for (const size of columnPlan(items.length, columns)) {
    grouped.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return grouped;
};

const MoviesSection: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const { width: baseWidth, columns } = useWallScale();

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  usePointerPan(viewportRef, contentRef);

  // Touch has no pointer to read, so those devices get a plain scrollable
  // viewport instead of the pan (scrollbars are hidden site-wide).
  const canPan = useMemo(
    () => window.matchMedia?.("(hover: hover)").matches ?? true,
    [],
  );

  // One flat list of every movie tagged by category. A watched entry whose
  // `post` points at a review is promoted to `reviewed`, so none is counted
  // twice — mirroring how BooksSection folds `read` into `reviewed`.
  const movies = useMemo<Shelved[]>(() => {
    const reviewed = getBlogPostsSync().filter((p) => p.tags === "Movie");
    const reviewedSlugs = new Set(reviewed.map((p) => p.slug));

    const reviewedShelf: Shelved[] = reviewed.map((p) => ({
      post: p,
      to: `/archive/${p.slug}`,
      category: "reviewed",
    }));

    const watchedShelf: Shelved[] = media.movies.watched
      .filter((m) => !(m.post && reviewedSlugs.has(m.post)))
      .map((m) => ({
        post: toPost(m),
        to: m.post ? `/archive/${m.post}` : null,
        category: "watched",
      }));

    const wishlistShelf: Shelved[] = media.movies.wishlist.map((m) => ({
      post: toPost(m),
      to: null,
      category: "wishlist",
    }));

    return [...reviewedShelf, ...watchedShelf, ...wishlistShelf];
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: 0,
      reviewed: 0,
      watched: 0,
      wishlist: 0,
    };
    for (const m of movies) {
      c[m.category] += 1;
      c.all += 1;
    }
    return c;
  }, [movies]);

  // The wall renders `shown`, which lags `filter` by one exit animation: on a
  // change the posters currently up drop off first, then the new set is
  // mounted and goes back up.
  const [shown, setShown] = useState<Filter>("all");
  const leaving = shown !== filter;

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setShown(filter), EXIT_MS + exitDelay(9, 9));
    return () => clearTimeout(id);
  }, [filter, leaving]);

  const visible =
    shown === "all" ? movies : movies.filter((m) => m.category === shown);

  const wall = useMemo(() => toColumns(visible, columns), [visible, columns]);
  const middle = (wall.length - 1) / 2;

  return (
    <div className="flex-1 w-full">
      {/* ── The wall ──
          Posters are stacked in columns rather than rows: each column is
          centred on the middle line and then drifts up or down, so posters sit
          shoulder to shoulder while their tops and bottoms never line up.

          It's pinned to the sheet itself (the nearest positioned ancestor), so
          it covers the whole screen — behind the filter bar and on down past
          the dock — rather than sitting in a band between them. The block runs
          past every edge by design; this is a window onto it, panned by where
          the cursor sits and by the wheel or trackpad (usePointerPan). */}
      <div
        ref={viewportRef}
        className={`absolute inset-0 flex items-center justify-center ${
          canPan ? "overflow-clip" : "overflow-auto"
        }`}
      >
        {visible.length === 0 ? (
          <div className="text-editorial-label text-sm">No movies yet.</div>
        ) : (
          <div
            ref={contentRef}
            className="flex items-center justify-center shrink-0 will-change-transform"
            style={{ gap: GAP, paddingBlock: MAX_DRIFT }}
          >
            {wall.map((column, c) => (
              <div
                key={c}
                className="flex flex-col items-center shrink-0"
                style={{
                  gap: GAP,
                  transform: `translateY(${COLUMN_DRIFT[c % COLUMN_DRIFT.length]}px)`,
                }}
              >
                {column.map((item, r) => {
                  const spread = Math.abs(c - middle);
                  return (
                    // The wrapper carries the drop-off / go-up animation, so it
                    // never fights the poster's own hover transform.
                    <div
                      key={`${item.category}-${item.post.slug}`}
                      className={leaving ? "animate-poster-out" : "animate-poster-in"}
                      style={{
                        animation: leaving
                          ? `posterOut ${EXIT_MS}ms ease-in forwards ${exitDelay(spread, r)}ms`
                          : `posterIn ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) backwards ${enterDelay(spread, r)}ms`,
                      }}
                    >
                      <MoviePoster
                        post={item.post}
                        to={item.to}
                        width={Math.round(
                          baseWidth *
                            WIDTH_SCALES[
                              slugHash(item.post.slug) % WIDTH_SCALES.length
                            ],
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter bar ──
          Sits over the wall; its own `data-no-pan` keeps the posters still
          while you're aiming at it, since reaching for a filter at the top of
          the screen would otherwise send them sliding. */}
      <FilterBar
        options={FILTERS.map((f) => ({ ...f, count: counts[f.key] }))}
        value={filter}
        onChange={setFilter}
        className="pt-2"
      />
    </div>
  );
};

export default MoviesSection;
