import fs from "fs";
import path from "path";

// ── Fills in cover/poster URLs for the media lists in src/data/media.json —
// books via Open Library (keyless), movies via TMDB (needs TMDB_API_KEY).
//
//   node scripts/fetch-media.js [--dry-run] [--force] [--only=books|movies]
//
// Scope: media.json only. Blog posts and book reviews keep their hand-uploaded
// images in /assets — this script never touches markdown.
//
// Entries with `"image": null` get resolved and the provider URL written back.
// When the search guesses wrong, pin the entry instead of editing this file:
//   "olCoverId": 10306590   (books)   "tmdbId": 12345   (movies)
// ─────────────────────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "src/data/media.json");

// Open Library answers 200 with a ~43-byte blank GIF when it has no cover, so
// anything this small is a miss dressed up as a hit.
const MIN_IMAGE_BYTES = 1024;

// Covers and posters are portrait (~0.65). Square art is the tell for a box-set
// or collection listing rather than the edition we asked for.
const MAX_ASPECT_RATIO = 0.9;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1];

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
 * Downloads the art once to prove the URL is worth hotlinking: catches the
 * blank-placeholder-with-a-200 and the square box-set covers before they reach
 * the live site.
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
      `not a portrait cover (${size.width}x${size.height}) — likely a collection listing`,
    );
};

// ── Resolvers ────────────────────────────────────────────────────────────────

/** Loose title equality — punctuation, case, diacritics and a leading article. */
const normalizeTitle = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/^the\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Open Library. Keyless.
 *
 * Uses the structured title/author fields, not free-text `q`: `q` ranks study
 * guides, workbooks and "3 Books Collection Set" bundles above the actual book,
 * and those bundles carry a cover_i, so they look like clean hits. The title
 * equality check drops whatever bundles still slip through.
 */
const resolveBookCover = async ({ title, author, olCoverId }) => {
  if (olCoverId) return `https://covers.openlibrary.org/b/id/${olCoverId}-L.jpg`;

  const wanted = normalizeTitle(title);

  // The structured search is strict about articles — "The Mill House Murders"
  // finds nothing when Open Library titled the record "Mill House Murders" —
  // so fall back to the article-stripped title. normalizeTitle keeps the
  // results comparable either way.
  const attempts = [title];
  const stripped = title.replace(/^(the|a|an)\s+/i, "");
  if (stripped !== title) attempts.push(stripped);

  for (const attempt of attempts) {
    const params = new URLSearchParams({
      title: attempt,
      limit: "10",
      fields: "title,author_name,cover_i",
    });
    if (author) params.set("author", author);

    const docs =
      (await getJson(`https://openlibrary.org/search.json?${params}`)).docs ??
      [];
    const doc = docs.find(
      (d) => d.cover_i && normalizeTitle(d.title) === wanted,
    );
    if (doc) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
  }

  return null;
};

/** TMDB. Needs TMDB_API_KEY. `year` narrows ambiguous titles (e.g. remakes). */
const resolveMoviePoster = async ({ title, year, tmdbId }) => {
  let posterPath;

  if (tmdbId) {
    posterPath = (
      await getJson(
        `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}`,
      )
    ).poster_path;
  } else {
    const params = new URLSearchParams({ api_key: TMDB_KEY, query: title });
    if (year) params.set("primary_release_year", String(year));
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

  if (only !== "movies") {
    console.log("Books (Open Library)");
    const r = await processSection(data.books, resolveBookCover);
    ok += r.ok;
    missed += r.missed;
  }

  if (only !== "books") {
    console.log("Movies (TMDB)");
    if (!TMDB_KEY) {
      console.warn("  skipped — set TMDB_API_KEY to fetch posters");
    } else {
      const r = await processSection(data.movies, resolveMoviePoster);
      ok += r.ok;
      missed += r.missed;
    }
  }

  if (ok > 0 && !dryRun)
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`\n${ok} resolved, ${missed} unresolved`);
  if (missed > 0)
    console.log("Pin unresolved entries with olCoverId / tmdbId in media.json.");
};

run().catch((err) => {
  console.error(`fetch-media failed: ${err.message}`);
  process.exitCode = 1;
});
