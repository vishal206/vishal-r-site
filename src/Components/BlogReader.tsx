import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import MovieDisk from "./MovieDisk";
import ReaderShell, { LogoBox } from "./ReaderShell";
import {
  loadMarkdownFileSync,
  loadChapterFileSync,
  getAvailablePosts,
  getAvailableChapters,
} from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "./CustomMarkdownReader";
import ContextToc, { extractHeadings } from "./ContextToc";
import { usePostEngagement } from "../hooks/usePostEngagement";
import { PostEngagement } from "./PostEngagement";
import { useComments } from "../hooks/useComments";
import { PostComments } from "./PostComments";

// Movies live in their own section; everything else (essays, chapters) is the archive.
const SECTIONS = {
  movie: {
    logo: "/assets/stickers/movie-sticker.png",
    title: "Movies",
    backTo: "/movies",
    backLabel: "Movies",
  },
  archive: {
    logo: "/assets/stickers/blog-sticker.png",
    title: "The Archive",
    backTo: "/archive",
    backLabel: "Archive",
  },
} as const;

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

interface SidebarEntry {
  slug: string;
  title: string;
  meta: string;
  ts: number; // ms timestamp for sorting
}

// Build unified list sorted newest-first by date
const buildUnifiedList = (): SidebarEntry[] => {
  const [blogSlugs, chSlugs] = [getAvailablePosts(), getAvailableChapters()];

  const blogs = blogSlugs.map((s) => loadMarkdownFileSync(s));
  const chapters = chSlugs.map((s) => loadChapterFileSync(s));

  const items: SidebarEntry[] = [];

  blogs.forEach((b) => {
    if (!b) return;
    items.push({
      slug: b.slug,
      title: b.frontmatter.title,
      meta: `${b.frontmatter.tags || "Essay"}`,
      ts: new Date(b.frontmatter.date).getTime(),
    });
  });

  chapters.forEach((ch) => {
    if (!ch) return;
    items.push({
      slug: ch.slug,
      title: ch.frontmatter.title,
      meta: `Chapter ${String(ch.frontmatter.sno).padStart(2, "0")}`,
      ts: new Date(ch.frontmatter.date).getTime(),
    });
  });

  // Newest first
  return items.sort((a, b) => b.ts - a.ts);
};

// Returns window: up to 2 newer (lower index), current, up to 2 older (higher index)
const getWindow = (all: SidebarEntry[], slug: string): SidebarEntry[] => {
  const idx = all.findIndex((i) => i.slug === slug);
  if (idx === -1) return [];
  const start = Math.max(0, idx - 2);
  const end = Math.min(all.length - 1, idx + 2);
  return all.slice(start, end + 1);
};

// ─────────────────────────────────────────────────────────────────────────────

const BlogReader = () => {
  const { slug } = useParams<{ slug: string }>();

  // Markdown is eager-bundled (see markdownLoader), so the entry and sidebar are
  // resolved synchronously on the first render. This means the prerendered HTML
  // and the client's first render are identical — hydration matches with no
  // loading flash, and SPA navigation between posts is instant.
  const { entry, sidebar } = useMemo(() => {
    if (!slug) return { entry: null, sidebar: [] as SidebarEntry[] };
    return {
      entry: loadEntry(slug),
      sidebar: getWindow(buildUnifiedList(), slug),
    };
  }, [slug]);
  const error = slug && !entry ? "Entry not found" : null;
  const engagement = usePostEngagement(slug);
  const { comments, submitting, submitComment } = useComments(slug);

  if (error || !entry)
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <p className="text-editorial-label text-sm">{error || "Not found"}</p>
      </div>
    );

  // ── Nav list (shared between sidebar + mobile overlay) ──
  const nav =
    sidebar.length > 1 &&
    sidebar.map((item) => {
      const isCurrent = item.slug === slug;
      return (
        <div
          key={item.slug}
          className={`py-4 border-b border-editorial-divider last:border-0 transition-opacity ${isCurrent ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
        >
          {isCurrent ? (
            <>
              <div className="text-[9px] uppercase tracking-[0.18em] text-available mb-1">
                Reading
              </div>
              <p className="text-sm font-display font-bold text-editorial-text leading-tight">
                {item.title}
              </p>
            </>
          ) : (
            <Link to={`/archive/${item.slug}`} className="block group">
              <div className="text-[9px] uppercase tracking-[0.18em] text-editorial-label mb-1 line-clamp-1">
                {item.meta}
              </div>
              <p className="text-sm font-display font-bold text-editorial-text leading-tight group-hover:opacity-70 transition-opacity line-clamp-2">
                {item.title}
              </p>
            </Link>
          )}
        </div>
      );
    });

  // ── Right rail: on-this-page table of contents for context-table posts ──
  const rightRail =
    entry.isContextTable && extractHeadings(entry.content).length > 0 ? (
      <ContextToc content={entry.content} />
    ) : undefined;

  const section =
    entry.label === "Movie" ? SECTIONS.movie : SECTIONS.archive;

  // Movies keep the poster disk beside the title; chapters keep their number
  // badge. Every other post (essays / life) with an image gets a 3:2 banner
  // shown between the title and the engagement row instead of a side thumbnail.
  const isMovie = entry.label === "Movie";
  const showBanner = Boolean(entry.image) && !isMovie;

  return (
    <ReaderShell
      brandLogo={section.logo}
      brandTitle={section.title}
      brandBare
      navLabel="In This Archive"
      backTo={section.backTo}
      backLabel={section.backLabel}
      nav={nav || undefined}
      rightRail={rightRail}
    >
      {/* ── Compact header ── */}
      <div className="mb-8 pb-8 border-b border-editorial-divider">
        <div className="flex items-center gap-5">
          {isMovie && entry.image ? (
            <MovieDisk
              post={{ slug: entry.slug, title: entry.title, date: entry.sortKey, image: entry.image }}
              tilt={-5}
              diskClassName="w-20 h-20 md:w-24 md:h-24 shrink-0"
            />
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
          <div className="aspect-[21/9] w-full overflow-hidden rounded-xl mt-6">
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
