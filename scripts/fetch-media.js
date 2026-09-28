import fs from "fs";
import path from "path";

// ── Fills in poster URLs for the movie lists in src/data/media.json via TMDB
// (needs TMDB_API_KEY).
//
//   node scripts/fetch-media.js [--dry-run] [--force]
//
// Scope: media.json only. Blog posts and reviews keep their hand-uploaded
// images in /assets — this script never touches markdown.
//
// Entries with `"image": null` get resolved and the TMDB URL written back.
// When the search guesses wrong, pin the entry instead of editing this file:
//   "tmdbId": 12345
// ─────────────────────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "src/data/media.json");

// Anything this small is a placeholder, not a poster — a miss dressed up as a
// hit.
const MIN_IMAGE_BYTES = 1024;

// Posters are portrait (~0.65). Square art is the tell for a collection
// listing rather than the film we asked for.
const MAX_ASPECT_RATIO = 0.9;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

const TMDB_KEY = process.env.TMDB_API_KEY;

// ── Helpers ──────────────────────────────────────────────────────────────────

const getJson = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": "vishalr.dev" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

/** Reads intrinsic dimensions straight from the JPEG/PNG header bytes. */
const imageSize = (bytes) => {
  if (bytes[0] === 0x89 && bytes[1] === 0x50)
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };

  // JPEG: walk the segment chain to the start-of-frame marker that carries the
  // dimensions. C4/C8/CC are huffman/arithmetic tables, not frame headers.
  for (let i = 2; i + 9 < bytes.length; ) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    i += 2 + bytes.readUInt16BE(i + 2);
  }

  return null;
};

/**
 * Downloads the art once to prove the URL is worth hotlinking: catches
 * placeholders and square collection art before they reach the live site.
 */
const validateArt = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < MIN_IMAGE_BYTES)
    throw new Error(`placeholder image (${bytes.length} bytes)`);

  const size = imageSize(bytes);
  if (size && size.width / size.height > MAX_ASPECT_RATIO)
    throw new Error(
      `not a portrait poster (${size.width}x${size.height}) — likely a collection listing`,
    );
};

// ── Resolvers ────────────────────────────────────────────────────────────────

/** TMDB. Needs TMDB_API_KEY. Pin ambiguous titles (e.g. remakes) with tmdbId. */
const resolveMoviePoster = async ({ title, tmdbId }) => {
  let posterPath;

  if (tmdbId) {
    posterPath = (
      await getJson(
        `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}`,
      )
    ).poster_path;
  } else {
    const params = new URLSearchParams({ api_key: TMDB_KEY, query: title });
    posterPath = (
      await getJson(`https://api.themoviedb.org/3/search/movie?${params}`)
    ).results?.find((r) => r.poster_path)?.poster_path;
  }

  return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
};

// ── Runner ───────────────────────────────────────────────────────────────────

/** Resolves every imageless entry across a section's lists. Mutates in place. */
const processSection = async (section, resolve) => {
  let ok = 0;
  let missed = 0;

  for (const [listName, entries] of Object.entries(section)) {
    for (const entry of entries) {
      if (entry.image && !force) continue;
      try {
        const url = await resolve(entry);
        if (!url) {
          console.warn(`  ✗ ${entry.title} (${listName}) — no match`);
          missed++;
          continue;
        }
        await validateArt(url);
        entry.image = url;
        console.log(`  ✓ ${entry.title} (${listName})`);
        ok++;
      } catch (err) {
        console.warn(`  ✗ ${entry.title} (${listName}) — ${err.message}`);
        missed++;
      }
    }
  }

  return { ok, missed };
};

const run = async () => {
  if (dryRun) console.log("(dry run — media.json not written)\n");

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  let ok = 0;
  let missed = 0;

  console.log("Movies (TMDB)");
  if (!TMDB_KEY) {
    console.warn("  skipped — set TMDB_API_KEY to fetch posters");
  } else {
    const r = await processSection(data.movies, resolveMoviePoster);
    ok += r.ok;
    missed += r.missed;
  }

  if (ok > 0 && !dryRun)
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`\n${ok} resolved, ${missed} unresolved`);
  if (missed > 0)
    console.log("Pin unresolved entries with tmdbId in media.json.");
};

run().catch((err) => {
  console.error(`fetch-media failed: ${err.message}`);
  process.exitCode = 1;
});
