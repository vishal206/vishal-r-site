import React, { useEffect, useMemo, useRef, useState } from "react";
import FilterBar from "../../components/FilterBar";
import MoviePoster from "../../components/MoviePoster";
import { usePointerPan } from "../../hooks/usePointerPan";
import { getBlogPostsSync } from "../../Utils/functions";
import type { BlogPostMeta } from "../../Utils/markdownLoader";
import { media } from "../../Utils/media";
import type { MediaMovie } from "../../Utils/media";

// What a film is shelved as. `reviewed` is a kind of watched — it's a film seen
// that also has a write-up — so it sits inside the Watched filter as well as
// having a filter of its own.
type Category = "reviewed" | "watched" | "wishlist";
type Filter = Category;

type Shelved = {
  post: BlogPostMeta;
  to: string | null;
  category: Category;
  score: number;
};

// ── Scores ───────────────────────────────────────────────────────────────────
// A film is scored 1–10 and the wall sizes it accordingly: the best films get
// the biggest posters. Reviewed films take their score from the post's
// frontmatter (`score: 9`), the rest from media.json. Anything unscored sits at
// the middle size, so the wall reads the same as before until scores are added.
const SCORE_MID = 5.5;

// How far a score moves a poster off the middle size: a 10 comes out a fifth
// bigger than the average, a 1 a fifth smaller. Turn this up for a wall with
// more shout to it — past ~0.35 the crop on the biggest posters gets tight.
const SCORE_AMP = 0.22;

const toScore = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(10, Math.max(1, value))
    : SCORE_MID;

/** A poster's share of its column's height, from its score. */
const scoreWeight = (score: number) =>
  1 + SCORE_AMP * ((score - SCORE_MID) / (SCORE_MID - 1));

/** A media.json entry dressed as a blog post so MoviePoster can render it. */
const toPost = (m: MediaMovie): BlogPostMeta => ({
  slug: m.post ?? m.title,
  title: m.title,
  date: "",
  image: m.image ?? undefined,
  tags: "Movie",
  description: "",
});

// Watched leads and is the wall you land on: everything seen, reviews included.
const FILTERS: { key: Filter; label: string }[] = [
  { key: "watched", label: "Watched" },
  { key: "reviewed", label: "Reviewed" },
  { key: "wishlist", label: "Wishlist" },
];

const DEFAULT_FILTER: Filter = "watched";

/** Watched is the wide shelf: a reviewed film is a watched film too. */
const inFilter = (category: Category, filter: Filter) =>
  filter === "watched"
    ? category === "watched" || category === "reviewed"
    : category === filter;

const POSTER_RATIO = 3 / 2; // poster height ÷ width — the standard sheet

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


/**
 * How many posters go in each column, left to right: as even a split as the
 * count allows, with the remainder handed out to alternating columns so the
 * fuller and emptier columns interleave rather than bunching at one end.
 *
 * Neighbouring columns holding different numbers of posters is what keeps the
 * wall from reading as rows — every column is the same height, so a column of
 * four has its seams in different places than the column of three beside it.
 */
const columnCounts = (n: number, columns: number): number[] => {
  const cols = Math.max(1, Math.min(columns, n));
  const base = Math.floor(n / cols);
  const extras = n - base * cols;

  // Two columns holding the same number of posters share every seam, so they
  // read as a little grid wherever they sit side by side. Handing the odd ones
  // out to alternating columns keeps that from happening — and when the odd
  // ones are the majority, it's the same trick upside down: start everything a
  // poster taller and thin out alternating columns instead.
  const majority = extras * 2 > cols;
  const counts = Array<number>(cols).fill(majority ? base + 1 : base);
  const step = majority ? -1 : 1;
  let left = majority ? cols - extras : extras;

  // Odd columns first, then even — the second pass only comes into play for
  // the narrow walls where alternating alone can't absorb the remainder.
  for (const start of [1, 0]) {
    for (let i = start; i < cols && left > 0; i += 2) {
      counts[i] += step;
      left -= 1;
    }
  }

  // Where the split came out even there was no remainder to alternate with, so
  // the wall would be every column the same. Walk it and push a poster across
  // any pair that still matches — between neighbours, so the total is
  // untouched and the columns stay within one or two of even.
  for (let i = 0; i + 1 < cols; i++) {
    if (counts[i] !== counts[i + 1]) continue;
    for (const dir of [1, -1]) {
      const a = counts[i] + dir;
      const b = counts[i + 1] - dir;
      // Never empty a column, and never solve one matching pair by creating
      // another with the column to the left.
      if (a < 1 || b < 1 || (i > 0 && counts[i - 1] === a)) continue;
      counts[i] = a;
      counts[i + 1] = b;
      break;
    }
  }

  return counts;
};

type WallCell = { item: Shelved; height: number };
type WallColumn = { cells: WallCell[]; width: number };

/**
 * Packs the films into a wall with no seams anywhere in it, biggest posters to
 * the best-scored films.
 *
 * The one rule that gets the seamless part: every column is squared off to the
 * same height. Fix that height and a column's width falls out of how many
 * posters it holds — height ÷ count ÷ the poster ratio — so a column of four
 * comes out narrower than a column of three. The width variety is a
 * consequence of the packing rather than something sprinkled on top, which is
 * why it tiles: no gaps between columns, none between posters, and a flat edge
 * all the way round.
 *
 * Scores ride on top of that in two ways, neither of which can open a gap. The
 * films are ranked and dealt into the columns biggest-cell-first, so the top
 * scores land in the wide columns; then within a column the fixed height is
 * shared out by score rather than evenly, so a favourite is taller than what
 * it sits above. Both are redistributions of space that's already spoken for.
 */
const buildWall = (
  items: Shelved[],
  columns: number,
  baseWidth: number,
): { wall: WallColumn[]; height: number } => {
  if (items.length === 0) return { wall: [], height: 0 };

  const counts = columnCounts(items.length, columns);

  // Start from the width the wall wants to be and let the equal-height
  // constraint pick the height: Σ widthᵢ = Σ height ÷ (ratio × countᵢ).
  const spread = counts.reduce((a, count) => a + 1 / count, 0);
  let height = (baseWidth * counts.length * POSTER_RATIO) / spread;

  // A column holding one or two posters would otherwise blow up to fill that
  // height. Cap the widest column and let the whole wall come down with it.
  const widest = height / (POSTER_RATIO * Math.min(...counts));
  const cap = baseWidth * 1.35;
  if (widest > cap) height *= cap / widest;

  // Best films first, and columns in the order of how big a poster they hold —
  // fewest posters means the widest column and the tallest cells. Only what
  // goes in each column changes; the columns themselves stay where they are,
  // so the big posters end up scattered over the wall rather than bunched.
  const ranked = [...items].sort((a, b) => b.score - a.score);
  const byCell = counts
    .map((count, i) => ({ count, i }))
    .sort((a, b) => a.count - b.count || a.i - b.i);

  const wall: WallColumn[] = Array(counts.length);
  let cursor = 0;
  for (const { count, i } of byCell) {
    const slice = ranked.slice(cursor, cursor + count);
    cursor += count;

    // The column's height is already fixed, so scores only decide how it's
    // divided up — the shares always add back to exactly the same total.
    const weights = slice.map((item) => scoreWeight(item.score));
    const total = weights.reduce((a, b) => a + b, 0);
    const cells = slice.map((item, j) => ({
      item,
      height: (height * weights[j]) / total,
    }));

    // Every column runs biggest-first otherwise, which puts a band of large
    // posters along the top of the wall. Flipping every other column breaks
    // that up.
    if (i % 2) cells.reverse();

    wall[i] = { cells, width: height / (POSTER_RATIO * count) };
  }

  return { wall, height };
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

const MoviesSection: React.FC = () => {
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
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
  // `post` points at a review is promoted to `reviewed` and dropped from the
  // watched shelf — otherwise, now that Watched carries the reviews too, a
  // reviewed film would go up on that wall twice. Mirrors how BooksSection
  // folds `read` into `reviewed`.
  const movies = useMemo<Shelved[]>(() => {
    const reviewed = getBlogPostsSync().filter((p) => p.tags === "Movie");
    const reviewedSlugs = new Set(reviewed.map((p) => p.slug));

    // A reviewed film's score comes off the post's frontmatter; a media.json
    // entry that also has a review can carry one either place, the post
    // winning, since that's where the write-up passing judgement lives.
    const scored = new Map(
      media.movies.watched.map((m) => [m.post ?? m.title, m.score]),
    );

    const reviewedShelf: Shelved[] = reviewed.map((p) => ({
      post: p,
      to: `/archive/${p.slug}`,
      category: "reviewed",
      score: toScore(p.score ?? scored.get(p.slug)),
    }));

    const watchedShelf: Shelved[] = media.movies.watched
      .filter((m) => !(m.post && reviewedSlugs.has(m.post)))
      .map((m) => ({
        post: toPost(m),
        to: m.post ? `/archive/${m.post}` : null,
        category: "watched",
        score: toScore(m.score),
      }));

    // Nothing on the wishlist has been seen, so nothing there has a score —
    // that wall comes out evenly sized, which is right.
    const wishlistShelf: Shelved[] = media.movies.wishlist.map((m) => ({
      post: toPost(m),
      to: null,
      category: "wishlist",
      score: SCORE_MID,
    }));

    return [...reviewedShelf, ...watchedShelf, ...wishlistShelf];
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { watched: 0, reviewed: 0, wishlist: 0 };
    for (const m of movies)
      for (const f of FILTERS) if (inFilter(m.category, f.key)) c[f.key] += 1;
    return c;
  }, [movies]);

  // The wall renders `shown`, which lags `filter` by one exit animation: on a
  // change the posters currently up drop off first, then the new set is
  // mounted and goes back up.
  const [shown, setShown] = useState<Filter>(DEFAULT_FILTER);
  const leaving = shown !== filter;

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setShown(filter), EXIT_MS + exitDelay(9, 9));
    return () => clearTimeout(id);
  }, [filter, leaving]);

  const visible = useMemo(
    () => movies.filter((m) => inFilter(m.category, shown)),
    [movies, shown],
  );

  const { wall, height } = useMemo(
    () => buildWall(visible, columns, baseWidth),
    [visible, columns, baseWidth],
  );
  const middle = (wall.length - 1) / 2;

  return (
    <div className="flex-1 w-full">
      {/* ── The wall ──
          Posters are stacked in columns rather than rows, packed edge to edge
          with no gaps: every column runs to the same height, so the columns
          butt up against each other and the block is a solid rectangle. What
          keeps it from reading as a grid is that neighbouring columns hold
          different numbers of posters, so no seam ever carries across (see
          `buildWall`).

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
            className="flex shrink-0 will-change-transform"
            style={{ height }}
          >
            {wall.map((column, c) => (
              <div
                key={c}
                className="flex flex-col shrink-0"
                style={{ width: column.width }}
              >
                {column.cells.map(({ item, height: cell }, r) => {
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
                        width={column.width}
                        height={cell}
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
