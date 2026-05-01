import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { setExclusionRect } from "../Utils/exclusionZone";
import {
  loadMarkdownFile,
  loadWeekNoteFile,
  loadChapterFile,
  getAvailablePosts,
  getAvailableWeekNotes,
  getAvailableChapters,
} from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "./CustomMarkdownReader";

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.toUpperCase();
    return d
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return dateStr.toUpperCase();
  }
};

// Unified entry shape ─────────────────────────────────────────────────────────
interface Entry {
  slug: string;
  title: string;
  label: string;
  sublabel: string;
  content: string;
  banner?: string;
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
const loadEntry = async (slug: string): Promise<Entry | null> => {
  const blog = await loadMarkdownFile(slug);
  if (blog) {
    return {
      slug,
      title: blog.frontmatter.title,
      label: blog.frontmatter.tags || "Essay",
      sublabel: formatDate(blog.frontmatter.date),
      content: blog.content,
      banner: blog.frontmatter.banner,
      sortKey: blog.frontmatter.date,
      isContextTable:
        blog.frontmatter.isContextTable === "true" ||
        blog.frontmatter.isContextTable === true,
    };
  }

  const wn = await loadWeekNoteFile(slug);
  if (wn) {
    return {
      slug,
      title: wn.frontmatter.title,
      label: "Weekly Log",
      sublabel: `Week #${wn.frontmatter.weeknoteCount} · ${formatDate(wn.frontmatter.date)}`,
      content: wn.content,
      sortKey: wn.frontmatter.date,
    };
  }

  const ch = await loadChapterFile(slug);
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
const buildUnifiedList = async (): Promise<SidebarEntry[]> => {
  const [blogSlugs, wnSlugs, chSlugs] = [
    getAvailablePosts(),
    getAvailableWeekNotes(),
    getAvailableChapters(),
  ];

  const [blogs, weeknotes, chapters] = await Promise.all([
    Promise.all(blogSlugs.map((s) => loadMarkdownFile(s))),
    Promise.all(wnSlugs.map((s) => loadWeekNoteFile(s))),
    Promise.all(chSlugs.map((s) => loadChapterFile(s))),
  ]);

  const items: SidebarEntry[] = [];

  blogs.forEach((b) => {
    if (!b) return;
    items.push({
      slug: b.slug,
      title: b.frontmatter.title,
      meta: `${b.frontmatter.tags || "Essay"} · ${formatDate(b.frontmatter.date)}`,
      ts: new Date(b.frontmatter.date).getTime(),
    });
  });

  weeknotes.forEach((wn) => {
    if (!wn) return;
    items.push({
      slug: wn.slug,
      title: wn.frontmatter.title,
      meta: `Week #${wn.frontmatter.weeknoteCount} · ${formatDate(wn.frontmatter.date)}`,
      ts: new Date(wn.frontmatter.date).getTime(),
    });
  });

  chapters.forEach((ch) => {
    if (!ch) return;
    items.push({
      slug: ch.slug,
      title: ch.frontmatter.title,
      meta: `Chapter ${String(ch.frontmatter.sno).padStart(2, "0")} · ${formatDate(ch.frontmatter.date)}`,
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
  const navigate = useNavigate();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [sidebar, setSidebar] = useState<
    { slug: string; title: string; meta: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setEntry(null);

    loadEntry(slug).then((e) => {
      if (!e) setError("Entry not found");
      else setEntry(e);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    buildUnifiedList().then((all) => {
      setSidebar(getWindow(all, slug));
    });
  }, [slug]);

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

  if (loading)
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <p className="text-editorial-label text-[11px] uppercase tracking-widest">
          Loading…
        </p>
      </div>
    );

  if (error || !entry)
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <p className="text-editorial-label text-sm">{error || "Not found"}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
      <div className="px-6 md:px-12 py-6 max-w-screen-xl mx-auto">
        {/* ── Header ── */}
        <header className="flex items-center justify-between pb-6 border-b border-editorial-divider">
          <Link
            to="/"
            className="text-3xl md:text-4xl font-display font-black text-editorial-text hover:opacity-80 transition-opacity leading-none"
          >
            Vishal R
          </Link>
          <nav className="flex gap-5 md:gap-12 text-[10px] md:text-[11px] uppercase tracking-[0.22em]">
            <button
              onClick={() => navigate("/archive")}
              className="text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
            >
              Blog
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>
          <div className="text-[10px] uppercase tracking-[0.18em] text-editorial-label text-right hidden md:block">
            Developer. Writer. Builder.
          </div>
        </header>

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
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-editorial-text leading-[0.92]">
            {entry.title}
          </h1>
        </div>

        {/* ── Banner ── */}
        {entry.banner && (
          <img
            src={entry.banner}
            alt={entry.title}
            className="w-full max-h-[480px] object-cover"
          />
        )}

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
          <article ref={articleRef} className="flex-1 md:pl-12 md:pr-12 pt-10 md:pt-12 max-w-3xl">
            <CustomMarkdownReader content={entry.content} />
            <div className="mt-16 pt-8 border-t border-editorial-divider">
              <button
                onClick={() => navigate(-1)}
                className="text-[10px] uppercase tracking-[0.22em] text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
              >
                ← Back
              </button>
            </div>
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
    </div>
  );
};

export default BlogReader;
