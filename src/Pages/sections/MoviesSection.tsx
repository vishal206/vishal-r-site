import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlassPlus } from "@fortawesome/free-solid-svg-icons";
import FilterBar from "../../components/FilterBar";
import MoviePoster from "../../components/MoviePoster";
import { mountChrome } from "../../components/posterMount";
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
// frontmatter (`score: 9`), the rest from media.json. Anything unscored sits
// at the middle, so the wall reads evenly until scores are added.
//
// Size is a matter of which column a film hangs in — a column holding fewer
// posters is wider, and every poster in it is bigger — not of how much of its
// column it takes: nothing on the wall is cropped, so within a column every
// poster is the same 2:3 sheet.
const SCORE_MID = 5.5;

const toScore = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(10, Math.max(1, value))
    : SCORE_MID;

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

// How far the wall may be zoomed by pinch or ctrl+wheel.
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.5;

// How big a poster pops to under the cursor: the artwork's height on screen
// becomes this share of the screen's long side, whatever the wall's zoom (a
// mount's frame and plate come on top). Never smaller than a nudge, so a
// wall already zoomed past that still pops.
const POP_SHARE = 0.25;
const POP_MIN = 1.08;

// The strip along the bottom the dock's stickers stand in, which the fitted
// wall keeps clear of so its bottom row isn't hung behind them. Stepped by
// the same breakpoints the dock scales itself by (see SectionDock): the row
// is about 200px tall at full size, and stands at 0.36 of that on a phone,
// 0.55 from sm, 0.72 from md and 0.6 from lg — plus a little air.
const dockReserveFor = (width: number) =>
  width >= 1024 ? 130 : width >= 768 ? 152 : width >= 640 ? 118 : 80;

/** A hair of paper kept between the fitted wall and the edge of the screen. */
const FIT_PAD = 8;

/**
 * What a middling poster measures across, by the standard screen breakpoints
 * (Tailwind's: sm 640, md 768, lg 1024, xl 1280, 2xl 1536). Scores step a
 * poster up or down from here, see `posterWidth`.
 */
const baseWidthFor = (width: number) =>
  width >= 1536
    ? 200
    : width >= 1280
      ? 180
      : width >= 1024
        ? 160
        : width >= 768
          ? 140
          : width >= 640
            ? 120
            : 96;

// Five fixed sizes, the middle one the base: the best films come out a
// third bigger than average, the worst a third smaller. A score picks the
// nearest step, so the wall reads in a handful of clear sizes rather than a
// smear of nearly-equal ones.
const SIZE_STEPS = [0.7, 0.85, 1, 1.15, 1.3];

/** A poster's width in px, from its score and the wall's base size. */
const posterWidth = (score: number, base: number) => {
  const step = Math.round(((score - 1) / 9) * (SIZE_STEPS.length - 1));
  return Math.round(base * SIZE_STEPS[step]);
};

/** The viewport's size, live — what sets poster size, and what the wall is
 * fitted into. */
const useViewportSize = (
  viewportRef: React.RefObject<HTMLDivElement | null>,
) => {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewportRef]);
  return size;
};

/** Where a poster hangs: its cell on the wall, in px from the top-left. */
type WallCell = {
  item: Shelved;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Rect = { x: number; y: number; w: number; h: number };

/**
 * The mount a film hangs in. A wishlist film gets the stone mount, no black
 * edge, with its facts on the plate; a watched film hangs bare — no edge, no stone, no
 * plate, just a wider gap off its neighbours — and keeps its note for the
 * hover.
 */
const chromeFor = (item: Shelved, mount: MountChrome): MountChrome =>
  item.category === "wishlist"
    ? { ...mount, edge: 0 }
    : { ...mount, gap: WATCHED_GAP * mount.frame, edge: 0, frame: 0, plate: 0 };

// How far apart bare posters hang, as a multiple of the stone frame the
// wishlist's mounts get: with no frame to hold them apart, the space itself
// has to do it.
const WATCHED_GAP = 1.6;

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w - 0.5 &&
  b.x < a.x + a.w - 0.5 &&
  a.y < b.y + b.h - 0.5 &&
  b.y < a.y + a.h - 0.5;

/**
 * Hangs the films out from the middle of the wall in the order they're
 * listed, sized by score, packed as tightly as that allows.
 *
 * Each poster is the standard 2:3 sheet, shown whole, at the width its score
 * gives it. The first film takes the centre; every one after it goes in the
 * spot closest to the centre that butts up against something already hung
 * and overlaps nothing — so the wall grows outward, the list order reading
 * as distance from the middle. Candidate spots are every position flush
 * against a hung poster's side with an edge lined up to some poster's edge,
 * which is what keeps the packing tight; where sizes don't tile the
 * difference is left as a hole, and those come out small.
 *
 * "Closest" is measured as a walk along the two axes rather than as the
 * crow flies, so the wall grows as a rhombus rather than a disc; and the
 * sideways leg is priced by the screen's shape (`aspect`, width over
 * height), so on a landscape screen the rhombus spreads wide and on a
 * portrait one it runs tall — the wall fills the screen it's on rather than
 * leaving bare paper down the sides or above and below.
 *
 * Returned in coordinates from the wall's top-left, on a block sized so the
 * centre of the first poster is the centre of the block.
 */
const buildWall = (
  items: Shelved[],
  base: number,
  mount: MountChrome | null = null,
  aspect = 1,
): { wall: WallCell[]; width: number; height: number } => {
  if (items.length === 0) return { wall: [], width: 0, height: 0 };

  // What a mount takes out of its cell before the artwork sees any of it: the
  // gap, the edge and a frame either side across, and the gap, both edges,
  // one frame and the plate down — per film, since a watched film's mount
  // has no stone in it (see `chromeFor`). Zero on a bare wall, where the
  // cell simply *is* the poster.
  const cellHeight = (item: Shelved, width: number) => {
    if (!mount) return Math.round(POSTER_RATIO * width);
    const c = chromeFor(item, mount);
    const across = c.gap + 2 * (c.edge + c.frame);
    const down = c.gap + 2 * c.edge + c.frame + c.plate;
    return Math.round(POSTER_RATIO * (width - across) + down);
  };

  const placed: Rect[] = [];
  for (const item of items) {
    const w = posterWidth(item.score, base);
    const h = cellHeight(item, w);
    if (placed.length === 0) {
      placed.push({ x: -w / 2, y: -h / 2, w, h });
      continue;
    }

    // The edges already on the wall, for lining up against.
    const xs = new Set<number>();
    const ys = new Set<number>();
    for (const r of placed) {
      xs.add(r.x);
      xs.add(r.x + r.w - w);
      ys.add(r.y);
      ys.add(r.y + r.h - h);
    }

    let best: Rect | null = null;
    let bestDist = Infinity;
    const consider = (x: number, y: number) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      // A rhombus contour has many spots at the same distance; among those,
      // the one nearest as the crow flies keeps the packing compact.
      const dist =
        Math.abs(cx) / aspect + Math.abs(cy) + (cx * cx + cy * cy) * 1e-6;
      if (dist >= bestDist) return;
      const rect = { x, y, w, h };
      if (placed.some((r) => overlaps(rect, r))) return;
      best = rect;
      bestDist = dist;
    };
    for (const r of placed) {
      for (const y of ys) {
        consider(r.x + r.w, y); // to its right
        consider(r.x - w, y); // to its left
      }
      for (const x of xs) {
        consider(x, r.y + r.h); // below it
        consider(x, r.y - h); // above it
      }
    }
    // Every spot flush against something is always open somewhere on the
    // outside, so this can't fail — the fallback only satisfies the types.
    placed.push(best ?? { x: -w / 2, y: -h / 2, w, h });
  }

  // Symmetric about the origin, so centring the block centres the first
  // poster.
  const halfW = Math.max(...placed.map((r) => Math.max(-r.x, r.x + r.w)));
  const halfH = Math.max(...placed.map((r) => Math.max(-r.y, r.y + r.h)));
  const width = Math.ceil(2 * halfW);
  const height = Math.ceil(2 * halfH);

  const wall = placed.map((r, i) => ({
    item: items[i],
    x: r.x + width / 2,
    y: r.y + height / 2,
    width: r.w,
    height: r.h,
  }));

  return { wall, width, height };
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
  // its neighbours, the edge and frame inside that, and the two px-1 paddings
  // between the frame and the type.
  const room = width - chrome.gap - 2 * (chrome.edge + chrome.frame) - 16;

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewport = useViewportSize(viewportRef);
  const base = baseWidthFor(viewport.width);
  const dockReserve = dockReserveFor(viewport.width);
  // The screen's shape, which the wall takes on (see `buildWall`). Stepped
  // coarsely so an ordinary window resize doesn't rehang the whole wall.
  const aspect = Math.max(
    0.25,
    Math.round((viewport.width / viewport.height) * 4) / 4,
  );

  // Zoom, as a plain scale on the block: pinch or ctrl+wheel on the wall, or
  // the buttons in the corner. CSS `zoom` rather than a transform so the block
  // grows in layout — the pan's limits and the touch viewport's scroll range
  // both follow it for free.
  const [scale, setScale] = useState(1);
  const zoomBy = useCallback(
    (factor: number) =>
      setScale((s) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s * factor))),
    [],
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const pan = usePointerPan(viewportRef, contentRef, zoomBy, scale);

  // Touch has no wheel to read, so those devices get a plain scrollable
  // viewport instead of the pan (scrollbars are hidden site-wide) — which is
  // laid out differently, see the wall's auto margins below.
  const canPan = useMemo(
    () => window.matchMedia?.("(hover: hover)").matches ?? true,
    [],
  );

  // One flat list of every movie tagged by category, in the order media.json
  // lists them — that order is where a film hangs on the wall, first entry
  // top-left. A watched entry whose `post` points at a review goes up as
  // `reviewed`, in its place in the list, rather than as a watched film and a
  // reviewed one both. Mirrors how BooksSection folds `read` into `reviewed`.
  const movies = useMemo<Shelved[]>(() => {
    const reviews = new Map(
      getBlogPostsSync()
        .filter((p) => p.tags === "Movie")
        .map((p) => [p.slug, p]),
    );

    // A reviewed film's score and note come off the post's frontmatter; when
    // it also has a media.json entry either can live in either place, the
    // post winning, since that's where the write-up passing judgement lives.
    const asReviewed = (p: BlogPostMeta, m?: MediaMovie): Unkeyed => ({
      post: p,
      to: `/archive/${p.slug}`,
      category: "reviewed",
      score: toScore(p.score ?? m?.score),
      note: p.note ?? m?.note,
    });

    const seen = new Set<string>();
    const watchedShelf: Unkeyed[] = media.movies.watched.map((m) => {
      const review = m.post ? reviews.get(m.post) : undefined;
      if (review) {
        seen.add(review.slug);
        return asReviewed(review, m);
      }
      return {
        post: toPost(m),
        to: m.post ? `/archive/${m.post}` : null,
        // A watched film with no write-up still goes somewhere, if its entry
        // carries a TMDB link — the review wins where there is one.
        href: !m.post && m.url ? m.url : null,
        category: "watched",
        score: toScore(m.score),
        note: m.note,
      };
    });

    // A review with no media.json entry still hangs — after the listed ones.
    const unlisted: Unkeyed[] = [...reviews.values()]
      .filter((p) => !seen.has(p.slug))
      .map((p) => asReviewed(p));

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
    return [...watchedShelf, ...unlisted, ...wishlistShelf].map((m, i) => ({
      ...m,
      key: `${m.category}-${m.post.slug}-${i}`,
    }));
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

  // Every wall hangs its pictures in mounts, a gap apart. Worked out once for
  // the whole wall, because the packing has to know what the chrome takes
  // before it can size a cell — and because one frame thickness across the
  // wall is how a room of pictures is hung.
  const mount = useMemo(() => mountChrome(base), [base]);

  const { wall, width, height } = useMemo(
    () => buildWall(visible, base, mount, aspect),
    [visible, base, mount, aspect],
  );

  // The first look at a wall is the whole of it: zoomed out until it fits the
  // viewport, edge to edge on whichever axis binds, clear of the dock. Never
  // zoomed *in* to fit — a wall of three posters is hung at its own size, not
  // blown up. Refitted whenever the wall or the window changes; zooming by
  // hand overrides it until then.
  //
  // Fitted along the screen's long side only: on a landscape screen the
  // wall's widest points reach the edges and its tips run off the top and
  // bottom; on a portrait one its tips reach the top and the dock (the
  // viewport carries the dock's strip as bottom padding, so the block is
  // centred in what's above the stickers) and its sides run off the edges.
  // What runs off is a pan away. The wall's shape follows the screen's, so
  // this fills the screen with posters where fitting both axes left the
  // corners bare.
  const fitScale = useMemo(() => {
    if (!width || !height) return 1;
    const roomW = viewport.width - 2 * FIT_PAD;
    const roomH = Math.max(
      viewport.height / 2,
      viewport.height - dockReserve - 2 * FIT_PAD,
    );
    const landscape = viewport.width >= viewport.height;
    const fit = landscape ? roomW / width : roomH / height;
    return Math.max(ZOOM_MIN, Math.min(1, fit));
  }, [width, height, viewport.width, viewport.height, dockReserve]);

  // Where the wall should be looked at after a zoom: a point on it (in the
  // block's own px) to bring to the middle of the screen, or nothing, for the
  // wall centred. Set alongside the scale and acted on once both have landed
  // — see below.
  type Look = { px: number; py: number } | null;
  const [look, setLook] = useState<{ at: Look; n: number }>({ at: null, n: 0 });
  const lookAt = useCallback(
    (at: Look) => setLook((l) => ({ at, n: l.n + 1 })),
    [],
  );

  useEffect(() => {
    setScale(fitScale);
    lookAt(null);
  }, [fitScale, lookAt]);

  // Which poster is under the cursor, so the rest of the room can dim while
  // it's popped: the hovered film becomes the spotlight.
  const [hovered, setHovered] = useState<string | null>(null);

  // The poster brought to the front. The dimming gives every other wrapper
  // a stacking context of its own, which would trap a popped poster's
  // z-index inside its wrapper and paint it in DOM order — behind whatever
  // comes later. So the wrapper itself is raised, and stays raised a beat
  // after the cursor leaves, long enough for the poster to shrink back.
  const [raised, setRaised] = useState<string | null>(null);
  const lower = useRef(0);
  const raise = useCallback((key: string) => {
    clearTimeout(lower.current);
    setRaised(key);
  }, []);
  const unraise = useCallback((key: string) => {
    clearTimeout(lower.current);
    lower.current = window.setTimeout(
      () => setRaised((k) => (k === key ? null : k)),
      1000,
    );
  }, []);

  // Acted on after the zoom has been applied and the pan has re-measured
  // for it (that effect is registered first, so it runs first). On the
  // panning viewport the offset is from centred, in screen px; on the
  // scrolling one it's a scroll position.
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const s = scaleRef.current;
    const { at } = look;
    if (canPan) {
      pan.panTo(
        at ? (width / 2 - at.px) * s : 0,
        at ? (height / 2 - at.py) * s : 0,
      );
    } else {
      el.scrollLeft = at
        ? at.px * s - el.clientWidth / 2
        : (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = at
        ? at.py * s - el.clientHeight / 2
        : (el.scrollHeight - el.clientHeight) / 2;
    }
  }, [look, canPan, pan, width, height]);

  // The stagger on the filter change ripples out from the middle of the wall,
  // in poster-widths from the centre.
  const ring = (x: number, y: number) =>
    Math.hypot(x - width / 2, y - height / 2) / base;

  return (
    <div className="flex-1 w-full">
      {/* ── The wall ──
          Posters hang where the packing put them (see `buildWall`): the first
          in the middle and the rest in rings around it, each as big as its
          score, each shown whole. They're positioned absolutely on a block
          centred in the viewport, which pans both ways and zooms.

          It's pinned to the sheet itself (the nearest positioned ancestor), so
          it covers the whole screen — behind the filter bar and on down past
          the dock — rather than sitting in a band between them. The block runs
          past every edge by design; this is a window onto it, panned by the
          wheel or trackpad (usePointerPan) and never on its own. */}
      <div
        ref={viewportRef}
        // No surface of its own: the sheet's dark dot grid shows through,
        // the same as behind every other section.
        className={`absolute inset-0 flex ${
          canPan ? "items-center justify-center overflow-clip" : "overflow-auto"
        }`}
        style={{
          // The dock's strip, so the wall is centred in what's above it.
          paddingBottom: dockReserve,
        }}
      >
        {visible.length === 0 ? (
          <div className="text-editorial-label text-sm">No movies yet.</div>
        ) : (
          <div
            ref={contentRef}
            // Not keyed by wall: usePointerPan takes hold of this element
            // once, on mount, so it has to be the same element for every wall
            // — remounting it would leave the pan driving a detached node.
            className="relative shrink-0 will-change-transform"
            // On the scrolling viewport the wall is centred by auto margins
            // rather than by the container: an auto margin takes only positive
            // free space, so a wall bigger than the screen sits flush at the
            // top-left and every part of it can be scrolled to. Centring it the
            // other way puts its top and left edges outside the scrollable
            // range, where nothing can reach them.
            style={{
              width,
              height,
              zoom: scale,
              margin: canPan ? undefined : "auto",
            }}
          >
            {wall.map(({ item, x, y, width, height: cell }) => {
              const spread = ring(x + width / 2, y + cell / 2);
              const depth = 0;
              const filmFacts = item.url ? facts.get(item.url) : null;
              const lines = filmFacts ? captionLines(filmFacts) : null;
              // The mount this one hangs in — the packing sized its cell
              // from the same one, so the two agree to the pixel.
              const chrome = chromeFor(item, mount);
              return (
                // The wrapper carries the drop-off / go-up animation, so it
                // never fights the poster's own hover transform.
                <div
                  key={item.key}
                  className={`absolute ${leaving ? "animate-poster-out" : "animate-poster-in"}`}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "touch") return;
                    setHovered(item.key);
                    raise(item.key);
                  }}
                  onPointerLeave={() => {
                    setHovered((k) => (k === item.key ? null : k));
                    unraise(item.key);
                  }}
                  style={{
                    left: x,
                    top: y,
                    width,
                    // The hovered poster on top of everything, the one it
                    // just left (still shrinking) above the rest.
                    zIndex:
                      hovered === item.key
                        ? 11
                        : raised === item.key
                          ? 10
                          : undefined,
                    // Dim the room: while another poster is popped, this one
                    // steps back — a touch darker and a touch greyer.
                    opacity: hovered && hovered !== item.key ? 0.7 : 1,
                    filter:
                      hovered && hovered !== item.key
                        ? "saturate(0.75)"
                        : undefined,
                    transition: "opacity 450ms ease, filter 450ms ease",
                    animation: leaving
                      ? `posterOut ${EXIT_MS}ms ease-in forwards ${exitDelay(spread, depth)}ms`
                      : `posterIn ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) backwards ${enterDelay(spread, depth)}ms`,
                  }}
                >
                  <MoviePoster
                    post={item.post}
                    to={item.to}
                    href={item.href}
                    width={width}
                    height={cell}
                    note={item.note}
                    // Every poster pops under the cursor, to the same size on
                    // screen: the pop is worked out from the artwork's height
                    // at the wall's current zoom, so the wall being zoomed
                    // out means a bigger pop, not a smaller poster.
                    hoverPop
                    // The dock is painted above the wall, so a poster along
                    // the bottom pops upward, clear of the stickers, rather
                    // than under them.
                    safeBottom={dockReserve}
                    popScale={Math.max(
                      POP_MIN,
                      (POP_SHARE * Math.max(viewport.width, viewport.height)) /
                        ((cell -
                          chrome.gap -
                          2 * chrome.edge -
                          chrome.frame -
                          chrome.plate) *
                          scale),
                    )}
                    caption={
                      item.category === "wishlist" ? (
                        <PosterCaption
                          lines={lines}
                          title={item.post.title}
                          width={width}
                          chrome={chrome}
                        />
                      ) : null
                    }

                    mounted
                    chrome={chrome}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Zoom hint ── Top-left, in the label grey: the wall zooms by
          pinch (or ctrl+wheel), and nothing on screen says so otherwise. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-editorial-label sm:left-5 sm:top-5"
      >
        <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-[12px]" />
        Pinch to zoom
      </div>

      {/* ── Filter bar ── Small, in the top-right corner of the sheet, so
          the wall's top tip has the top of the screen to itself. */}
      <FilterBar
        options={FILTERS.map((f) => ({ ...f, count: counts[f.key] }))}
        value={filter}
        onChange={setFilter}
        placement="corner"
        compact
      />
    </div>
  );
};

export default MoviesSection;
