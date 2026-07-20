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
};

export type MediaMovie = {
  title: string;
  year?: number;
  image: string | null;
  post?: string;
  tmdbId?: number; // pins the TMDB entry when search guesses wrong
};

export type MediaLists = {
  books: { read: MediaBook[]; wishlist: MediaBook[] };
  movies: { watched: MediaMovie[]; wishlist: MediaMovie[] };
};

export const media = mediaData as MediaLists;
