import { useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import MovieDisk from "./MovieDisk";
import ScrollToTopButton from "./ScrollToTopButton";
import { setExclusionRect } from "../Utils/exclusionZone";
import {
  loadMarkdownFileSync,
  loadChapterFileSync,
  getAvailablePosts,
  getAvailableChapters,
} from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "./CustomMarkdownReader";
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

interface TocHeading {
  level: number;
  text: string;
  id: string;
}

const extractHeadings = (content: string): TocHeading[] => {
  return content
    .split("\n")
    .filter((line) => /^#{1,3}\s/.test(line))
    .map((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (!match) return null;
      const text = match[2].trim();
      return {
        level: match[1].length,
        text,
        id: text
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "-"),
      };
    })
    .filter(Boolean) as TocHeading[];
};

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
  const articleRef = useRef<HTMLElement>(null);
  const engagement = usePostEngagement(slug);
  const { comments, submitting, submitComment } = useComments(slug);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const update = () => setExclusionRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [entry]);

  // Clear exclusion zone when leaving the page entirely
  useEffect(() => () => setExclusionRect(null), []);

  if (error || !entry)
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <p className="text-editorial-label text-sm">{error || "Not found"}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
      <SiteHeader />
      <div className="px-6 md:px-12 pb-6 max-w-screen-xl mx-auto">
        {/* ── Article header ── */}
        <div className="pt-10 md:pt-14 pb-8 md:pb-12 border-b border-editorial-divider">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[10px] uppercase tracking-[0.22em] text-available">
              {entry.label}
            </span>
            {entry.sublabel && (
              <>
                <div className="w-8 h-px bg-editorial-divider shrink-0" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-editorial-label hidden sm:block">
                  {entry.sublabel}
                </span>
              </>
            )}
          </div>

          {entry.label === "Movie" && entry.image && (
            <div className="flex justify-start mb-6">
              <MovieDisk
                post={{ slug: entry.slug, title: entry.title, date: entry.sortKey, image: entry.image }}
                tilt={-5}
                diskClassName="w-52 h-52 md:w-64 md:h-64 lg:w-72 lg:h-72"
              />
            </div>
          )}

          {/* Title with a small square thumbnail on the right */}
          <div className="flex items-start gap-5 md:gap-8">
            <h1 className="flex-1 min-w-0 text-4xl md:text-6xl lg:text-7xl font-display font-black text-editorial-text leading-[1.05]">
              {entry.title}
            </h1>
            {entry.image && entry.label !== "Movie" && (
              <img
                src={entry.image}
                alt={entry.title}
                className="shrink-0 w-20 h-20 md:w-28 md:h-28 object-cover rounded-xl"
              />
            )}
          </div>

          <PostEngagement
            {...engagement}
            commentCount={comments.length}
            variant="compact"
          />
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col md:flex-row gap-0">
          {/* Sidebar */}
          {sidebar.length > 1 && (
            <aside className="hidden md:block w-52 shrink-0 border-r border-editorial-divider pr-8 pt-12">
              <div className="text-[9px] uppercase tracking-[0.22em] text-editorial-label mb-5">
                In This Archive
              </div>
              <div>
                {sidebar.map((item) => {
                  const isCurrent = item.slug === slug;
                  return (
                    <div
                      key={item.slug}
                      className={`py-4 border-b border-editorial-divider transition-opacity ${isCurrent ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
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
                        <Link
                          to={`/archive/${item.slug}`}
                          className="block group"
                        >
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
                })}
              </div>
            </aside>
          )}

          {/* Content */}
          <article
            ref={articleRef}
            className="flex-1 md:pl-12 md:pr-12 pt-10 md:pt-12 max-w-3xl"
          >
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
          </article>

          {/* Context Table (right sidebar) */}
          {entry.isContextTable &&
            (() => {
              const headings = extractHeadings(entry.content);
              if (headings.length === 0) return null;

              // Build hierarchical numbers: 1, 2 for h1; 1.1, 1.2 for h2; 1.1.1 for h3
              const counters = [0, 0, 0];
              const numbered = headings.map((h) => {
                const idx = h.level - 1;
                counters[idx]++;
                for (let i = idx + 1; i < 3; i++) counters[i] = 0;
                const number = counters.slice(0, idx + 1).join(".");
                return { ...h, number };
              });

              return (
                <aside className="hidden xl:block w-52 shrink-0 pl-8 pt-12">
                  <div className="sticky top-8">
                    <div className="text-[9px] uppercase tracking-[0.22em] text-editorial-label mb-5">
                      On This Page
                    </div>
                    <nav className="flex flex-col gap-1">
                      {numbered.map((h, i) => (
                        <a
                          key={i}
                          href={`#${h.id}`}
                          className={`flex gap-2 py-1 text-editorial-label hover:text-editorial-text transition-colors leading-snug ${
                            h.level === 1
                              ? "text-[11px] font-semibold pl-0"
                              : h.level === 2
                                ? "text-[10px] pl-2"
                                : "text-[9px] pl-4 opacity-80"
                          }`}
                        >
                          <span className="shrink-0 text-editorial-label opacity-50">
                            {h.number}
                          </span>
                          <span>{h.text}</span>
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              );
            })()}
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default BlogReader;
