import mediaData from "../data/media.json";

// ── Media lists ──────────────────────────────────────────────────────────────
// Read/watched + wishlist live in src/data/media.json; cover art is hotlinked
// from Open Library / TMDB by `npm run fetch-media` (entries added by hand with
// `"image": null`, resolved by the script). Reviewed items link back to their
// blog post via `post`. This is separate from blog/review images, which stay
// hand-uploaded in /assets.

export type MediaBook = {
  title: string;
  author: string;
  image: string | null;
  post?: string; // slug of the review, when one exists
  olCoverId?: number; // pins the Open Library cover when search guesses wrong
  volumes?: string[]; // cover URLs, one per volume in a set — renders as an animated pile; count = length
};

export type MediaMovie = {
  title: string;
  image: string | null;
  post?: string;
  tmdbId?: number; // pins the TMDB entry when search guesses wrong
  score?: number | null; // 1–10; the higher it is, the bigger the poster on the wall. Reviewed films take theirs from the post's frontmatter instead. Null (how new entries start) sits a film at the middle size.
  note?: string | null; // a line worth keeping — usually a bit of dialogue — shown along the bottom of the poster on hover. Keep it short; the poster clips it after four lines.
};

export type MediaLists = {
  books: { read: MediaBook[]; wishlist: MediaBook[] };
  movies: { watched: MediaMovie[]; wishlist: MediaMovie[] };
};

export const media = mediaData as MediaLists;
