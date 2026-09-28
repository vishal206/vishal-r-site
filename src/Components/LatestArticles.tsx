import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getBlogPostsSync } from "../Utils/functions";
import { loadMarkdownFileSync } from "../Utils/markdownLoader";
import type { BlogPostMeta } from "../Utils/markdownLoader";

// Posts after the featured one, in columns of two beside it.
const SIDE_COLUMNS = 2;
const PER_COLUMN = 2;
const WORDS_PER_MINUTE = 200;

/** "31 May 2026", whatever shape the frontmatter wrote the date in. */
const formatDate = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

/** Markdown down to its words: no tags, images, link targets or marks. */
const plainText = (md: string) =>
  md
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * What the featured card says about a post. Posts don't carry descriptions,
 * so the excerpt is the first paragraph of real prose — skipping headings,
 * quotes, lists, tables and bare HTML — and the read time comes from the
 * word count.
 */
const summarise = (slug: string) => {
  const content = loadMarkdownFileSync(slug)?.content ?? "";
  const excerpt =
    content
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter((block) => !/^(#|>|[-*+] |\d+\. |\||<)/.test(block))
      .map(plainText)
      .find((text) => text.length >= 40) ?? "";
  const words = plainText(content).split(" ").filter(Boolean).length;
  return {
    excerpt,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
};

/**
 * A post's image, or a plain tile carrying its tag when it has none. The image
 * fills the box rather than sizing it, so the box's own shape (an aspect ratio,
 * or the room left in a stacked card) decides the height.
 */
const Cover = ({ post, className }: { post: BlogPostMeta; className: string }) => (
  <div className={`${className} relative w-full overflow-hidden bg-editorial-divider`}>
    {post.image ? (
      <img
        src={post.image}
        alt={post.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-end p-5 text-[10px] uppercase tracking-[0.2em] text-editorial-label">
        {post.tags || "Essay"}
      </div>
    )}
  </div>
);

const CARD =
  "group flex flex-col overflow-hidden rounded-2xl border border-editorial-divider bg-white/[0.02] transition-colors hover:border-editorial-label";

/** A smaller card: cover, then title and date. */
const SideCard = ({ post }: { post: BlogPostMeta }) => (
  <Link to={`/archive/${post.slug}`} className={CARD}>
    <Cover post={post} className="aspect-[16/9] lg:aspect-auto lg:flex-1 lg:min-h-0" />
    <div className="p-4">
      <h4 className="text-base font-display font-bold text-editorial-text leading-snug line-clamp-2 group-hover:opacity-80 transition-opacity">
        {post.title}
      </h4>
      <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-editorial-label">
        {formatDate(post.date)}
      </div>
    </div>
  </Link>
);

// The newest writing on the home page: the latest post as a featured card and
// the ones after it in columns of two beside it — one column on smaller
// screens (three posts), two from lg, where a landscape screen has the room
// (five posts) — under a heading with a way through to the whole archive.
// Movie reviews are left out, as in the archive — they hang on the movie shelf.
const LatestArticles = ({ onMore }: { onMore: () => void }) => {
  const posts = useMemo(
    () =>
      getBlogPostsSync()
        .filter((p) => p.tags !== "Movie")
        .slice(0, 1 + SIDE_COLUMNS * PER_COLUMN),
    [],
  );
  const [featured, ...rest] = posts;
  const columns = Array.from({ length: SIDE_COLUMNS }, (_, i) =>
    rest.slice(i * PER_COLUMN, (i + 1) * PER_COLUMN),
  ).filter((column) => column.length > 0);
  const summary = useMemo(
    () => (featured ? summarise(featured.slug) : null),
    [featured],
  );

  if (!featured || !summary) return null;

  return (
    <section className="pb-12 md:pb-16">
      {/* ── Heading row: the label, and the way through to the archive ── */}
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-available">
          Articles I wrote
        </div>
        <button
          type="button"
          onClick={onMore}
          className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-editorial-label transition-colors hover:text-editorial-text"
        >
          More articles →
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr_1fr]">
        {/* ── Featured: the latest post ── */}
        <Link to={`/archive/${featured.slug}`} className={CARD}>
          <Cover post={featured} className="aspect-[16/9]" />
          <div className="flex flex-1 flex-col p-5">
            <span className="self-start rounded-md bg-available/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-available">
              Latest
            </span>
            <h3 className="mt-3 text-xl md:text-2xl font-display font-bold text-editorial-text leading-tight group-hover:opacity-80 transition-opacity">
              {featured.title}
            </h3>
            {summary.excerpt && (
              <p className="mt-2 text-sm font-body text-editorial-muted leading-relaxed line-clamp-3">
                {summary.excerpt}
              </p>
            )}
            <div className="mt-auto pt-4 text-[10px] uppercase tracking-[0.2em] text-editorial-label">
              {formatDate(featured.date)} · {summary.minutes} min read
            </div>
          </div>
        </Link>

        {/* ── Columns of two, each stacked to the featured card's height.
            Only the first shows below lg. ── */}
        {columns.map((column, i) => (
          <div
            key={i}
            className={`${
              i > 0 ? "hidden lg:grid" : "grid"
            } gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2`}
          >
            {column.map((post) => (
              <SideCard key={post.slug} post={post} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default LatestArticles;
