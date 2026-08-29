import { useEffect, useState } from "react";

// ── The Movie Database, at runtime ───────────────────────────────────────────
// A wishlist entry in media.json carries the film's TMDB link and nothing else
// about it. Everything the wall labels a poster with — how long it runs, what
// it is, what TMDB makes of it — is read off that link when the wall goes up,
// so none of it is typed in by hand and none of it goes stale.
//
// Needs VITE_TMDB_API_KEY. Vite bakes a VITE_ variable into the bundle, so the
// key ships to the browser in plain sight; TMDB's v3 keys are read-only, which
// is what makes that survivable, but it is a public key and should be one you
// don't mind rotating.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

/** How long to wait on TMDB before giving up and leaving the caption blank. */
const TIMEOUT_MS = 8000;

export type TmdbRef = { type: "movie" | "tv"; id: number };

export type TmdbFacts = {
  type: "movie" | "tv";
  runtime: number | null; // minutes; per episode for a series
  episodes: number | null; // series only
  genres: string[];
  rating: number | null; // TMDB's own score, 0–10
};

/**
 * The kind and the id out of a TMDB link, in whatever shape it was copied out
 * of the address bar — the slug, a trailing path and a query string are all
 * ignored, so any of these work as the `url` on an entry:
 *
 *   https://www.themoviedb.org/movie/550
 *   https://www.themoviedb.org/movie/550-fight-club
 *   https://www.themoviedb.org/tv/80183-banana-fish/seasons?language=en
 *
 * Series matter here as much as films: the wishlist carries anime runs, and
 * TMDB files those under /tv, where they answer with an episode count and a
 * per-episode runtime rather than one running time.
 */
export const parseTmdbUrl = (url?: string): TmdbRef | null => {
  const found = url?.match(/themoviedb\.org\/(movie|tv)\/(\d+)/);
  return found
    ? { type: found[1] as TmdbRef["type"], id: Number(found[2]) }
    : null;
};

// ── Fetching, once per film per session ──────────────────────────────────────
// The wall is rebuilt on every filter change and every resize, and the same
// films come back each time, so two caches sit in front of TMDB: sessionStorage
// so a film is fetched once a session rather than once a mount, and a map of
// in-flight requests so twenty posters going up at once can't ask twice.

const CACHE_PREFIX = "tmdb:1:";

const cacheKey = ({ type, id }: TmdbRef) => `${CACHE_PREFIX}${type}:${id}`;

// Storage throws outright in some privacy modes rather than just coming back
// empty, and a caption is never worth taking the wall down over.
const readCache = (key: string): TmdbFacts | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as TmdbFacts) : null;
  } catch {
    return null;
  }
};

const writeCache = (key: string, facts: TmdbFacts) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(facts));
  } catch {
    // Nothing to do — the fetch still worked, it just won't be remembered.
  }
};

const request = async (ref: TmdbRef): Promise<TmdbFacts | null> => {
  if (!KEY) return null;

  const res = await fetch(
    `https://api.themoviedb.org/3/${ref.type}/${ref.id}?api_key=${KEY}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) return null;
  const d = await res.json();

  return {
    type: ref.type,
    // A series has no single running time: TMDB keeps the lengths its episodes
    // have run to, and the first is the show's usual one.
    runtime:
      ref.type === "tv"
        ? (d.episode_run_time?.[0] ?? d.last_episode_to_air?.runtime ?? null)
        : (d.runtime || null),
    episodes: ref.type === "tv" ? (d.number_of_episodes ?? null) : null,
    genres: (d.genres ?? []).map((g: { name: string }) => g.name),
    // TMDB returns a flat 0 for anything nobody has voted on.
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
  };
};

const inFlight = new Map<string, Promise<TmdbFacts | null>>();

const load = (ref: TmdbRef): Promise<TmdbFacts | null> => {
  const key = cacheKey(ref);

  const hit = readCache(key);
  if (hit) return Promise.resolve(hit);

  const already = inFlight.get(key);
  if (already) return already;

  const pending = request(ref)
    .then((facts) => {
      if (facts) writeCache(key, facts);
      return facts;
    })
    // A film TMDB won't answer for gets its caption dropped, not an error: the
    // wall is artwork first, and one missing label shouldn't cost the page.
    .catch(() => null)
    .finally(() => inFlight.delete(key));

  inFlight.set(key, pending);
  return pending;
};

/**
 * Facts for a set of TMDB links, keyed by the link itself.
 *
 * A link that hasn't come back yet isn't in the map at all; one that couldn't
 * be read maps to `null`. That's the difference between "still loading" and
 * "there's nothing to show", which is what lets a caption hold its space
 * quietly instead of flashing a placeholder it's about to replace.
 *
 * They land in one go rather than one at a time — a wall of twenty posters
 * re-rendering per arrival is both jumpy to watch and wasteful, and the whole
 * set is a single round trip's wait anyway.
 *
 * `urls` must be a stable array (memoise it); `enabled` holds the fetch back
 * until the wall that needs it is actually being looked at.
 */
export const useTmdbFacts = (urls: string[], enabled = true) => {
  const [facts, setFacts] = useState<Map<string, TmdbFacts | null>>(
    () => new Map(),
  );

  useEffect(() => {
    if (!enabled || urls.length === 0) return;

    let live = true;
    Promise.all(
      urls.map(async (url) => {
        const ref = parseTmdbUrl(url);
        return [url, ref ? await load(ref) : null] as const;
      }),
    ).then((entries) => {
      if (live) setFacts(new Map(entries));
    });

    return () => {
      live = false;
    };
  }, [urls, enabled]);

  return facts;
};

// ── Labelling ────────────────────────────────────────────────────────────────

/** 139 → "2h 19m". Under an hour it's just the minutes. */
const minutes = (n: number) => {
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/**
 * How long it runs. A series has no single answer, so it gets the shape of the
 * commitment instead — how many episodes, and how long each one is.
 */
export const runtimeLabel = (facts: TmdbFacts): string | null => {
  if (!facts.runtime) return null;
  return facts.type === "tv" && facts.episodes
    ? `${facts.episodes} × ${minutes(facts.runtime)}`
    : minutes(facts.runtime);
};
