import { useMemo } from "react";
import { Link } from "react-router-dom";
import ArticleCard, { Cover } from "./ArticleCard";
import { loadMarkdownFileSync } from "../Utils/markdownLoader";
import type { BlogPostMeta } from "../Utils/markdownLoader";
import { ARTICLE_CARD, formatDate } from "../Utils/articles";

// Posts after the featured one, in columns of two beside it — FEATURED_COUNT
// (Utils/articles) in all, featured included.
const SIDE_COLUMNS = 2;
const PER_COLUMN = 2;
const WORDS_PER_MINUTE = 200;

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
 * The featured block shared by the home page and the article list: the first
 * post as a large card, the next four in two columns of two beside it (on lg
 * and up). Below lg the columns stack under it; the home page shows only the
 * first there to stay compact, while the list shows both (`showAllBelowLg`),
 * since those posts appear nowhere else on it.
 */
const FeaturedArticles = ({
  posts,
  showAllBelowLg = false,
}: {
  posts: BlogPostMeta[];
  showAllBelowLg?: boolean;
}) => {
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
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr_1fr]">
      {/* ── Featured: the latest post ── */}
      <Link to={`/article/${featured.slug}`} className={ARTICLE_CARD}>
        <Cover post={featured} tagInset="bottom-5 left-5" />
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

      {/* ── Columns of two beside the featured card. Below lg only the
          first shows, unless `showAllBelowLg`. ── */}
      {columns.map((column, i) => (
        <div
          key={i}
          className={`${
            i > 0 && !showAllBelowLg ? "hidden lg:grid" : "grid"
          } gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2`}
        >
          {column.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default FeaturedArticles;
