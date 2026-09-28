import { getBlogPostsSync } from "./functions";
import type { BlogPostMeta } from "./markdownLoader";

/**
 * How many posts the featured block (see FeaturedArticles) shows: the
 * featured one and two columns of two beside it.
 */
export const FEATURED_COUNT = 5;

/**
 * The newest articles, newest first — all of them unless `count` says
 * otherwise. Movie reviews are left out — they hang on the movie shelf — and
 * so is `excludeSlug`, the one being read.
 */
export const getLatestArticles = (
  count = Infinity,
  excludeSlug?: string,
): BlogPostMeta[] =>
  getBlogPostsSync()
    .filter((p) => p.tags !== "Movie" && p.slug !== excludeSlug)
    .slice(0, count);

/** "31 May 2026", whatever shape the frontmatter wrote the date in. */
export const formatDate = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

/** The box every article card sits in. */
export const ARTICLE_CARD =
  "group flex flex-col overflow-hidden rounded-2xl border border-editorial-divider bg-white/[0.02] transition-colors hover:border-editorial-label";
