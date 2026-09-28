import { useMemo } from "react";
import { useParams } from "react-router-dom";
import MoviePoster from "./MoviePoster";
import ReaderShell, { LogoBox } from "./ReaderShell";
import {
  loadMarkdownFileSync,
  loadChapterFileSync,
} from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "./CustomMarkdownReader";
import ContextToc, { extractHeadings } from "./ContextToc";
import RailArticles from "./RailArticles";
import { usePostEngagement } from "../hooks/usePostEngagement";
import { PostEngagement } from "./PostEngagement";
import { useComments } from "../hooks/useComments";
import { PostComments } from "./PostComments";

// Unified entry shape ─────────────────────────────────────────────────────────
interface Entry {
  slug: string;
  title: string;
  label: string;
  sublabel: string;
  content: string;
  banner?: string;
  image?: string;
  sortKey: string; // ISO date string or "0000-{sno}" for chapters
  isContextTable?: boolean;
}

// Try each source in order; return first match
const loadEntry = (slug: string): Entry | null => {
  const blog = loadMarkdownFileSync(slug);
  if (blog) {
    return {
      slug,
      title: blog.frontmatter.title,
      label: blog.frontmatter.tags || "Essay",
      sublabel: "",
      content: blog.content,
      banner: blog.frontmatter.banner,
      image: blog.frontmatter.image,
      sortKey: blog.frontmatter.date,
      isContextTable:
        blog.frontmatter.isContextTable === "true" ||
        blog.frontmatter.isContextTable === true,
    };
  }

  const ch = loadChapterFileSync(slug);
  if (ch) {
    return {
      slug,
      title: ch.frontmatter.title,
      label: "Chapters of Life",
      sublabel: String(ch.frontmatter.sno).padStart(2, "0"),
      content: ch.content,
      sortKey: `0000-${String(ch.frontmatter.sno).padStart(4, "0")}`,
    };
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────

const BlogReader = () => {
  const { slug } = useParams<{ slug: string }>();

  // Markdown is eager-bundled (see markdownLoader), so the entry is resolved
  // synchronously on the first render. This means the prerendered HTML and the
  // client's first render are identical — hydration matches with no loading
  // flash, and SPA navigation between posts is instant.
  const entry = useMemo(() => (slug ? loadEntry(slug) : null), [slug]);
  const error = slug && !entry ? "Entry not found" : null;
  const engagement = usePostEngagement(slug);
  const { comments, submitting, submitComment } = useComments(slug);

  if (error || !entry)
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <p className="text-editorial-label text-sm">{error || "Not found"}</p>
      </div>
    );

  // ── Right rail: the on-this-page table of contents (for context-table
  // posts), then the latest articles ──
  const hasToc =
    entry.isContextTable && extractHeadings(entry.content).length > 0;
  // The rail is as tall as the space under the header and doesn't scroll as
  // a whole: the latest articles always show in full, and the contents list
  // takes what's left — shrinking to fit, then scrolling on its own. It never
  // shrinks below ~6 lines (11rem with its heading); on a screen too short for
  // that and the articles, the rail itself scrolls instead (see ReaderShell).
  const rightRail = (
    <div className="flex min-h-0 flex-1 flex-col gap-10">
      {hasToc && (
        <div className="flex min-h-[11rem] flex-initial flex-col">
          <ContextToc content={entry.content} />
        </div>
      )}
      <div className="shrink-0">
        <RailArticles currentSlug={slug} />
      </div>
    </div>
  );

  // Movies keep the poster beside the title; chapters keep their number
  // badge. Every other post (essays / life) with an image gets a 16:9 banner
  // shown between the title and the engagement row instead of a side thumbnail.
  const isMovie = entry.label === "Movie";
  const showBanner = Boolean(entry.image) && !isMovie;

  return (
    <ReaderShell rightRail={rightRail}>
      {/* ── Compact header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-5">
          {isMovie && entry.image ? (
            <MoviePoster src={entry.image} title={entry.title} className="w-[76px] shrink-0" />
          ) : entry.sublabel ? (
            <LogoBox logo={entry.sublabel} title={entry.title} size="lg" />
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] uppercase tracking-[0.22em] text-available">
                {entry.label}
              </span>
              {entry.sublabel && (
                <span className="text-[10px] uppercase tracking-[0.22em] text-editorial-label">
                  {entry.sublabel}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-editorial-text leading-tight">
              {entry.title}
            </h1>
          </div>
        </div>
        {showBanner && (
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl mt-6">
            <img
              src={entry.image}
              alt={entry.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <PostEngagement
          {...engagement}
          commentCount={comments.length}
          variant="compact"
        />
      </div>

      <CustomMarkdownReader content={entry.content} />
      <PostEngagement
        {...engagement}
        commentCount={comments.length}
        variant="full"
      />
      <PostComments
        comments={comments}
        submitting={submitting}
        onSubmit={submitComment}
      />
    </ReaderShell>
  );
};

export default BlogReader;
