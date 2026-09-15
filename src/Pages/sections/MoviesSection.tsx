import React, { useEffect, useMemo, useRef, useState } from "react";
import FilterBar from "../../components/FilterBar";
import MoviePoster from "../../components/MoviePoster";
import { MOUNT_GAP, mountChrome } from "../../components/posterMount";
import type { MountChrome } from "../../components/posterMount";
import { usePointerPan } from "../../hooks/usePointerPan";
import { getBlogPostsSync } from "../../Utils/functions";
import type { BlogPostMeta } from "../../Utils/markdownLoader";
import { media } from "../../Utils/media";
import type { MediaMovie } from "../../Utils/media";
import { runtimeLabel, useTmdbFacts } from "../../Utils/tmdb";
import type { TmdbFacts } from "../../Utils/tmdb";

// What a film is shelved as. `reviewed` is a kind of watched — it's a film seen
// that also has a write-up — so it sits inside the Watched filter as well as
// having a filter of its own.
type Category = "reviewed" | "watched" | "wishlist";
type Filter = Category;

type Shelved = {
  /**
   * The React key its poster hangs by. Unique across the whole shelf, whatever
   * the data says: two entries for one film would otherwise share a key, and
   * React then loses track of one of them — its wrapper is left behind in the
   * column's DOM every time the wall re-renders, invisible after the exit
   * animation but still holding its height, and the gaps pile up.
   */
  key: string;
  post: BlogPostMeta;
  to: string | null;
  /** Off-site link, for a film with nothing on this site to point at. */
  href?: string | null;
  category: Category;
  score: number;
  note?: string | null;
  /** The film's TMDB link, where a wishlist poster goes and its caption comes from. */
  url?: string;
};

/** A shelf entry before it's been numbered — the key is stamped on last. */
type Unkeyed = Omit<Shelved, "key">;

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

// `height` is the whole cell; `poster` is what's left of it once the caption
// strip under the artwork has taken its slice. They're the same on an
// uncaptioned wall.
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
  mount: MountChrome | null = null,
): { wall: WallColumn[]; height: number } => {
  if (items.length === 0) return { wall: [], height: 0 };

  const counts = columnCounts(items.length, columns);

  // What a mount takes out of its cell before the artwork sees any of it: the
  // gap and a frame either side across, and the gap, one frame and the plate
  // down (the foot of a mount is the plate, not another frame). Zero on a bare
  // wall, where the cell simply *is* the poster.
  const across = mount ? MOUNT_GAP + 2 * mount.frame : 0;
  const down = mount ? MOUNT_GAP + mount.frame + mount.plate : 0;

  /** The column width that puts a `count`-poster column at exactly `h` tall. */
  const widthAt = (h: number, count: number) =>
    (h / count - down) / POSTER_RATIO + across;

  // Start from the width the wall wants to be and let the equal-height
  // constraint pick the height: Σ widthᵢ = Σ (height ÷ countᵢ − down) ÷ ratio
  // + across, solved for height.
  const spread = counts.reduce((a, count) => a + 1 / count, 0);
  let height =
    (counts.length * (POSTER_RATIO * (baseWidth - across) + down)) / spread;

  // A column holding one or two posters would otherwise blow up to fill that
  // height. Cap the widest column and let the whole wall come down with it —
  // solved for the height that puts the fewest-poster column exactly on the
  // cap, since with the chrome in the way the two aren't in proportion.
  const fewest = Math.min(...counts);
  const cap = baseWidth * 1.35;
  if (widthAt(height, fewest) > cap)
    height = fewest * (POSTER_RATIO * (cap - across) + down);

  // What goes in the widest columns first, then on down. On a bare wall that's
  // the best-scored films; on a mounted one it's simply the order the list is
  // written in, so the entries at the top of the wishlist hang biggest.
  //
  // Columns are taken in the order of how big a poster they hold — fewest
  // posters means the widest column. Only what goes in each column changes;
  // the columns themselves stay where they are, so the big pictures end up
  // scattered over the wall rather than bunched down one end.
  const ranked = mount ? items : [...items].sort((a, b) => b.score - a.score);
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
    //
    // Not in a mounted column, though: the chrome is the same depth under
    // every picture, so cells of different heights would leave artwork of
    // different proportions in one column, and only one of them could be 3:2.
    // Size varies between columns there instead of within them.
    const weights = slice.map((item) => (mount ? 1 : scoreWeight(item.score)));
    const total = weights.reduce((a, b) => a + b, 0);
    const cells = slice.map((item, j) => ({
      item,
      height: (height * weights[j]) / total,
    }));

    // A bare column runs biggest-first otherwise, which puts a band of large
    // posters along the top of the wall; flipping every other column breaks
    // that up. A mounted column is all one size, so there's no band to break
    // — and flipping it would only scramble the order the list is written in.
    if (i % 2 && !mount) cells.reverse();

    wall[i] = { cells, width: widthAt(height, count) };
  }

  return { wall, height };
};

// What a character of each plate line actually measures, taken from the widest
// line of its kind on the wall and rounded up. Both are set in the site's own
// face, but the genres are uppercase and tracked, which costs about half as
// much again per character. Erring high costs a point of type size or one
// genre; erring low clips, which is the one thing a plate must never do.
const EM_FACTS = 0.85;
const EM_CAPS = 1.3;

/** How small the plate's type may be driven before legibility gives out. */
const INK_FLOOR = 8;
const LABEL_FLOOR = 7;

/** The largest size up to `size` that holds `text` within `room`. */
const fitted = (text: string, size: number, em: number, room: number) =>
  Math.min(size, room / Math.max(1, text.length * em));

// TMDB's own names for a few genres are far longer than a mount is wide, and
// truncate into something unreadable (`SCIENCE FIC…`). These are the ones that
// actually turn up on the wishlist; everything else is short enough as it is.
const GENRE_SHORT: Record<string, string> = {
  "Science Fiction": "Sci-Fi",
  "Sci-Fi & Fantasy": "Sci-Fi",
  "Action & Adventure": "Action",
  "War & Politics": "War",
};

/**
 * The lines a wishlist film is labelled with, or null when TMDB gave back
 * nothing worth setting. Split out from the rendering so the wall can tell an
 * empty label from a full one *before* it decides whether to hang a frame.
 */
const captionLines = (facts: TmdbFacts) => {
  const runtime = runtimeLabel(facts);
  const rating = facts.rating ? `★ ${facts.rating.toFixed(1)}` : null;
  // Handed over as parts rather than one string: how much air goes between
  // them is the plate's business, and it depends on how much room it has.
  const parts = [runtime, rating].filter((v): v is string => Boolean(v));
  // TMDB lists genres most-defining first, and a third never fits — how many
  // of the two remaining are shown is left to the plate, which knows how much
  // room it has.
  const genres = facts.genres.slice(0, 2).map((g) => GENRE_SHORT[g] ?? g);
  return parts.length || genres.length ? { parts, genres } : null;
};

/**
 * A wishlist film's facts, set on the mount plate under its poster: how long
 * it runs, what TMDB makes of it, and what kind of thing it is. Fetched from
 * the entry's TMDB link when the wall goes up — nothing here is typed into
 * media.json.
 *
 * It's set on the mount the poster hangs in — the same frame a reviewed film
 * gets for its note, but permanent here rather than hover-only. The frame and
 * its plate come out of the poster's own cell, so a wall of them tiles exactly
 * as a wall of bare posters does.
 */
const PosterCaption = ({
  lines,
  title,
  width,
  chrome,
}: {
  /** Null while TMDB hasn't answered, or for a film with no link to ask with. */
  lines: { parts: string[]; genres: string[] } | null;
  title: string;
  /** The cell's width — only the fit tests need it. */
  width: number;
  chrome: MountChrome;
}) => {
  const wallInk = Math.min(11, Math.max(9, chrome.plate * 0.22));
  // Set off the plate's own depth rather than off the facts above it, so the
  // two sizes can be turned independently — the genres are already at the
  // smallest tracked caps that stay readable.
  const wallLabel = Math.max(8, Math.min(11, chrome.plate * 0.192));

  // The room a line of type has: the cell, less the gap the mount stands off
  // its neighbours, the frame inside that, and the two px-1 paddings between
  // the frame and the type.
  const room = width - MOUNT_GAP - 2 * chrome.frame - 16;

  // A film whose facts haven't arrived, or that has no link to fetch them
  // with, still hangs in a mount — so its plate carries its title rather than
  // nothing. The wall never shows an empty frame.
  if (!lines)
    return (
      <span
        className="max-w-full truncate px-1 font-primary font-bold text-editorial-mount-ink/75"
        style={{
          fontSize: Math.max(INK_FLOOR, fitted(title, wallInk, EM_FACTS, room)),
          lineHeight: 1.25,
        }}
      >
        {title}
      </span>
    );

  // Three ways to set the facts, roomiest first, taking the first that holds at
  // a size worth reading. Air around the divider where there's room for it —
  // HTML collapses ordinary spaces, and the pair wants more than one gives.
  // Then the pair tight, with the star left to do the separating on its own.
  // Then, on a mount too narrow for both, the rating alone: it's the shorter
  // of the two, and it's the one a wishlist is really asking about.
  //
  // Giving up space, and then a fact, both beat driving the type down to
  // something nobody can read.
  const forms = [
    lines.parts.join("\u2002·\u2002"),
    lines.parts.join(" "),
    lines.parts[lines.parts.length - 1] ?? "",
  ];
  const line =
    forms.find((f) => fitted(f, wallInk, EM_FACTS, room) >= INK_FLOOR) ??
    forms[forms.length - 1];

  const ink = Math.max(INK_FLOOR, fitted(line, wallInk, EM_FACTS, room));

  // Two genres on a narrow mount come out as a stub — `FANTASY · A…` — which
  // says less than one whole genre does, so the pair is measured against the
  // plate before it's set and the second dropped when it won't make it.
  const pair = lines.genres.join(" · ");
  const genres =
    lines.genres.length > 1 && pair.length * wallLabel * EM_CAPS > room
      ? lines.genres[0]
      : pair;

  // Never larger than the facts above them. On a narrow mount the facts are
  // driven down by how much room the line needs, while a one-word genre isn't
  // — left alone the secondary line would end up the bigger of the two.
  //
  // Tracked caps are wide, and the smallest mounts on a phone can't hold even
  // one genre at a size worth reading. Those drop the line rather than set it
  // at five points or clip it — the facts above are the half worth keeping,
  // and a plate with one line on it still looks deliberate.
  const label = Math.min(fitted(genres, wallLabel, EM_CAPS, room), ink);
  const genreLine = label >= LABEL_FLOOR ? genres : "";

  return (
    <span className="flex w-full flex-col items-center justify-center gap-0.5 px-1">
      {line && (
        <span
          className="max-w-full truncate font-primary font-bold text-editorial-mount-ink"
          style={{ fontSize: ink, lineHeight: 1.25 }}
        >
          {line}
        </span>
      )}
      {genreLine && (
        <span
          className="max-w-full truncate font-primary uppercase text-editorial-mount-ink/65"
          style={{
            fontSize: label,
            lineHeight: 1.3,
            letterSpacing: "0.14em",
            // The tracking is applied to the right of every letter, the last
            // one included, which throws a centred line visibly off-centre.
            textIndent: "0.14em",
          }}
        >
          {genreLine}
        </span>
      )}
    </span>
  );
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
  // viewport instead of the pan (scrollbars are hidden site-wide) — which is
  // laid out differently, see the wall's auto margins below.
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

    // A reviewed film's score and note come off the post's frontmatter; when it
    // also has a media.json entry either can live in either place, the post
    // winning, since that's where the write-up passing judgement lives.
    const entries = new Map(
      media.movies.watched.map((m) => [m.post ?? m.title, m]),
    );

    const reviewedShelf: Unkeyed[] = reviewed.map((p) => ({
      post: p,
      to: `/archive/${p.slug}`,
      category: "reviewed",
      score: toScore(p.score ?? entries.get(p.slug)?.score),
      note: p.note ?? entries.get(p.slug)?.note,
    }));

    const watchedShelf: Unkeyed[] = media.movies.watched
      .filter((m) => !(m.post && reviewedSlugs.has(m.post)))
      .map((m) => ({
        post: toPost(m),
        to: m.post ? `/archive/${m.post}` : null,
        category: "watched",
        score: toScore(m.score),
        note: m.note,
      }));

    // Nothing on the wishlist has been seen, so nothing there has a score —
    // that wall comes out evenly sized, which is right. There's no write-up to
    // click through to either, so a poster goes to the film's TMDB page: where
    // its caption is read from, and where you'd go next to decide whether to
    // watch it.
    const wishlistShelf: Unkeyed[] = media.movies.wishlist.map((m) => ({
      post: toPost(m),
      to: null,
      href: m.url ?? null,
      category: "wishlist",
      score: SCORE_MID,
      note: m.note,
      url: m.url,
    }));

    // Numbered down the whole shelf so the key can't collide even where the
    // data lists a film twice (see `Shelved.key`).
    return [...reviewedShelf, ...watchedShelf, ...wishlistShelf].map(
      (m, i) => ({ ...m, key: `${m.category}-${m.post.slug}-${i}` }),
    );
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

  // Every TMDB link on the wishlist, in one stable array — the hook fetches on
  // its identity, and this list never changes after the first render.
  const wishlistUrls = useMemo(
    () =>
      media.movies.wishlist
        .map((m) => m.url)
        .filter((url): url is string => Boolean(url)),
    [],
  );

  // Held back until the wishlist has actually been opened: most visits never
  // get to it, and there's no reason to spend a round trip per film on a wall
  // nobody is looking at. Once it's been opened it stays on, so coming back to
  // it doesn't refetch — and the session cache means a reload usually doesn't
  // either.
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (filter === "wishlist") setWanted(true);
  }, [filter]);

  const facts = useTmdbFacts(wishlistUrls, wanted);

  // The wishlist hangs in frames; the other walls are bare posters. Worked out
  // once for the whole wall, because the packing has to know what the chrome
  // takes before it can size a column — and because one frame thickness across
  // the wall is how a room of pictures is hung.
  //
  // Only once there's a link somewhere on the shelf: with nothing to fetch,
  // there's nothing to put on a plate, and the wall is better as the seamless
  // block it has always been than as a grid of empty mounts.
  const mount = useMemo(
    () =>
      shown === "wishlist" && visible.some((m) => m.url)
        ? mountChrome(baseWidth)
        : null,
    [shown, visible, baseWidth],
  );

  const { wall, height } = useMemo(
    () => buildWall(visible, columns, baseWidth, mount),
    [visible, columns, baseWidth, mount],
  );
  const middle = (wall.length - 1) / 2;

  // Now that the wall starts at the top-left of the scrolling viewport, park
  // the scroll in the middle of it — the same "dropped into the middle of the
  // wall" first look the pan gives on desktop, with the edges a swipe away.
  useEffect(() => {
    if (canPan) return;
    const el = viewportRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, [canPan, wall, height]);

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
        className={`absolute inset-0 flex ${
          canPan ? "items-center justify-center overflow-clip" : "overflow-auto"
        }`}
      >
        {visible.length === 0 ? (
          <div className="text-editorial-label text-sm">No movies yet.</div>
        ) : (
          <div
            ref={contentRef}
            className="flex shrink-0 will-change-transform"
            // On the scrolling viewport the wall is centred by auto margins
            // rather than by the container: an auto margin takes only positive
            // free space, so a wall bigger than the screen sits flush at the
            // top-left and every part of it can be scrolled to. Centring it the
            // other way puts its top and left edges outside the scrollable
            // range, where nothing can reach them.
            style={{ height, margin: canPan ? undefined : "auto" }}
          >
            {wall.map((column, c) => (
              // Keyed by wall as well as position, so a column div is never
              // carried over from one wall to the next: whatever one wall
              // leaves in it can't turn up as a gap in another.
              <div
                key={`${shown}-${c}`}
                className="flex flex-col shrink-0"
                style={{ width: column.width }}
              >
                {column.cells.map(({ item, height: cell }, r) => {
                  const spread = Math.abs(c - middle);
                  const filmFacts = item.url ? facts.get(item.url) : null;
                  const lines = filmFacts ? captionLines(filmFacts) : null;
                  // Every poster on a mounted wall is mounted — the packing
                  // already sized its cell for a frame, so leaving one bare
                  // would hand it a cell it doesn't fit.
                  const hung = Boolean(mount) && item.category === "wishlist";
                  return (
                    // The wrapper carries the drop-off / go-up animation, so it
                    // never fights the poster's own hover transform.
                    <div
                      key={item.key}
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
                        href={item.href}
                        width={column.width}
                        height={cell}
                        note={item.note}
                        // The pop is there to bring a poster forward and show
                        // what's written under it. A wishlist film is already
                        // hung in its mount with its facts on show, so there's
                        // nothing left for a hover to reveal and the wall is
                        // better still.
                        hoverPop={item.category !== "wishlist"}
                        caption={
                          hung && mount ? (
                            <PosterCaption
                              lines={lines}
                              title={item.post.title}
                              width={column.width}
                              chrome={mount}
                            />
                          ) : null
                        }
                        mounted={hung}
                        chrome={mount ?? undefined}
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
