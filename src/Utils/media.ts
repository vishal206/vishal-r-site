import mediaData from "../data/media.json";

// ── Media lists ──────────────────────────────────────────────────────────────
// Watched films live in src/data/media.json; poster art is hotlinked from
// TMDB by `npm run fetch-media` (entries added by hand with `"image": null`,
// resolved by the script). Reviewed films link back to their blog post via
// `post`. This is separate from blog/review images, which stay hand-uploaded
// in /assets.

export type MediaMovie = {
  title: string;
  image: string | null;
  post?: string; // slug of the review, when one exists
  tmdbId?: number; // pins the TMDB entry when search guesses wrong
  url?: string; // the film's TMDB page, pasted in by hand — a poster with no review links there
  note?: string | null; // a line worth keeping — usually a bit of dialogue — shown as a subtitle when the poster is revealed. Markdown marks (`*…*`) are dropped.
};

export type MediaLists = {
  movies: { watched: MediaMovie[] };
};

export const media = mediaData as MediaLists;
