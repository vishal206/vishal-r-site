import { Link } from "react-router-dom";
import type { BlogPostMeta } from "../Utils/markdownLoader";
import { ARTICLE_CARD, formatDate } from "../Utils/articles";

/**
 * A post's image (or a plain tile when it has none), with the post's tag on a
 * small label in the bottom-left corner. Every article image on the site is
 * 16:9 — the home page, the archive and the reader — and the image fills that
 * box rather than sizing it, cropped to fit. The label sits on a dark, blurred
 * backing so it reads over any artwork.
 *
 * `tagInset` places the label: pass the card's own body padding (as bottom and
 * left classes) so it lines up with the text below the image.
 */
export const Cover = ({
  post,
  className = "",
  tagInset = "bottom-4 left-4",
}: {
  post: BlogPostMeta;
  className?: string;
  tagInset?: string;
}) => (
  <div
    className={`${className} relative aspect-[16/9] w-full overflow-hidden bg-editorial-divider`}
  >
    {post.image && (
      <img
        src={post.image}
        alt={post.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    )}
    {/* Even padding all round. Letter-spacing also trails the last letter,
        so the text gives that back on the right to keep the sides equal. */}
    <span className={`absolute ${tagInset} rounded-md bg-black/60 p-1.5 text-[9px] leading-none uppercase tracking-[0.2em] text-white backdrop-blur-sm`}>
      <span className="-mr-[0.2em] block">{post.tags || "Essay"}</span>
    </span>
  </div>
);

/**
 * A small article card: the cover, then the title (and date). `compact` is for
 * narrow spots like the reader's side rail — tighter, a smaller title that's
 * never cut short, and no date.
 */
const ArticleCard = ({
  post,
  compact = false,
}: {
  post: BlogPostMeta;
  compact?: boolean;
}) => (
  <Link to={`/article/${post.slug}`} className={ARTICLE_CARD}>
    <Cover post={post} tagInset={compact ? "bottom-3 left-3" : "bottom-4 left-4"} />
    <div className={compact ? "p-3" : "p-4"}>
      <h4
        className={`font-display font-bold text-editorial-text leading-snug group-hover:opacity-80 transition-opacity ${
          compact ? "text-sm" : "text-base line-clamp-2"
        }`}
      >
        {post.title}
      </h4>
      {!compact && (
        <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-editorial-label">
          {formatDate(post.date)}
        </div>
      )}
    </div>
  </Link>
);

export default ArticleCard;
