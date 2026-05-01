import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BlogPostMeta,
  WeekNoteMeta,
  getAvailableWeekNotes,
  loadWeekNoteFile,
} from "../Utils/markdownLoader";
import { fetchBlogPosts } from "../Utils/functions";
import MovieDisk from "../components/MovieDisk";

type FilterType = "all" | "weeklylogs" | string;

interface UnifiedEntry {
  slug: string;
  title: string;
  date: string;
  tags?: string;
  type: "blog" | "weeknote";
  weeknoteCount?: number;
}

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.toUpperCase();
    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return dateStr.toUpperCase();
  }
};

const TAGS = ["Devlog", "Movie", "Tech", "Life"];
const ALL_FILTERS = [
  { key: "all", label: "All Entries" },
  { key: "weeklylogs", label: "Weekly Logs" },
  ...TAGS.map((t) => ({ key: t, label: t })),
];

const ArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogPostMeta[]>([]);
  const [weekNotes, setWeekNotes] = useState<WeekNoteMeta[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchBlogPosts(
      () => {},
      (l) => {
        if (!l) setLoading(false);
      },
      setBlogs
    );

    const fetchWeekNotes = async () => {
      const slugs = getAvailableWeekNotes();
      const promises = slugs.map(async (slug) => {
        const wn = await loadWeekNoteFile(slug);
        if (!wn) return null;
        return {
          slug,
          title: wn.frontmatter.title,
          date: wn.frontmatter.date,
          weeknoteCount: wn.frontmatter.weeknoteCount,
        } as WeekNoteMeta;
      });
      const fetched = (await Promise.all(promises)).filter(
        Boolean
      ) as WeekNoteMeta[];
      setWeekNotes(
        fetched.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    };
    fetchWeekNotes();
  }, []);

  const blogEntries: UnifiedEntry[] = blogs.map((b) => ({
    slug: b.slug,
    title: b.title,
    date: b.date,
    tags: b.tags,
    type: "blog",
  }));

  const weekNoteEntries: UnifiedEntry[] = weekNotes.map((wn) => ({
    slug: wn.slug,
    title: wn.title,
    date: wn.date,
    type: "weeknote",
    weeknoteCount: wn.weeknoteCount,
  }));

  const allEntries = [...blogEntries, ...weekNoteEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getCount = (f: FilterType) => {
    if (f === "all") return allEntries.length;
    if (f === "weeklylogs") return weekNoteEntries.length;
    return blogEntries.filter((e) => e.tags?.toLowerCase() === f.toLowerCase())
      .length;
  };

  const filteredEntries =
    filter === "all"
      ? allEntries
      : filter === "weeklylogs"
      ? weekNoteEntries
      : blogEntries.filter(
          (e) => e.tags?.toLowerCase() === filter.toLowerCase()
        );

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const pagedEntries = filteredEntries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
        {/* ── Header ── */}
        <header className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-editorial-divider">
          <Link
            to="/"
            className="text-xl md:text-2xl font-display font-black text-editorial-text hover:opacity-80 transition-opacity leading-none"
          >
            Vishal R
          </Link>

          <nav className="flex gap-5 md:gap-12 text-[10px] md:text-[11px] uppercase tracking-[0.22em]">
            <span className="text-editorial-text border-b border-editorial-text pb-0.5">
              Blog
            </span>
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
      <div className="px-6 md:px-12 pb-6 max-w-screen-xl mx-auto">

        {/* ── Mobile filter chips ── */}
        <div className="flex md:hidden gap-2 overflow-x-auto py-4 -mx-6 px-6 border-b border-editorial-divider">
          {ALL_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`shrink-0 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] border transition-colors cursor-pointer whitespace-nowrap ${
                filter === key
                  ? "border-available text-available"
                  : "border-editorial-divider text-editorial-label hover:border-editorial-label"
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-60">{getCount(key)}</span>
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col md:flex-row mt-6 md:mt-12">

          {/* Left sidebar — desktop only */}
          <aside className="hidden md:block w-44 shrink-0 border-r border-editorial-divider pr-8">
            <div className="text-[9px] uppercase tracking-[0.22em] text-editorial-label mb-5">
              Classifications
            </div>

            <div className="space-y-3">
              <SidebarItem
                label="All Entries"
                count={getCount("all")}
                active={filter === "all"}
                onClick={() => handleFilterChange("all")}
              />
              <SidebarItem
                label="Weekly Logs"
                count={getCount("weeklylogs")}
                active={filter === "weeklylogs"}
                onClick={() => handleFilterChange("weeklylogs")}
              />

              <div className="h-px bg-editorial-divider !mt-5 !mb-4" />

              {TAGS.map((tag) => (
                <SidebarItem
                  key={tag}
                  label={tag}
                  count={getCount(tag)}
                  active={filter === tag}
                  onClick={() => handleFilterChange(tag)}
                />
              ))}
            </div>
          </aside>

          {/* Right — entry list / disk view */}
          <main className="flex-1 md:pl-12">
            {loading ? (
              <div className="text-editorial-label text-[11px] uppercase tracking-widest py-6">
                Loading...
              </div>
            ) : filter === "Movie" ? (
              /* ── Disk view for Movie filter ── */
              blogs.filter((p) => p.tags === "Movie").length === 0 ? (
                <div className="text-editorial-label text-sm py-6">No movies found.</div>
              ) : (
                <div className="flex flex-wrap gap-10 md:gap-16 pt-10 pb-6 items-end">
                  {blogs
                    .filter((p) => p.tags === "Movie")
                    .map((post, i) => (
                      <MovieDisk
                        key={post.slug}
                        post={post}
                        tilt={i % 2 === 0 ? -5 : 4}
                      />
                    ))}
                </div>
              )
            ) : filteredEntries.length === 0 ? (
              <div className="text-editorial-label text-sm py-6">
                No entries found.
              </div>
            ) : (
              <>
                <div>
                  {pagedEntries.map((entry) => (
                    <Link
                      key={`${entry.type}-${entry.slug}`}
                      to={`/archive/${entry.slug}`}
                      className="group flex items-start gap-4 md:gap-8 py-5 md:py-6 border-b border-editorial-divider"
                    >
                      {/* Date — desktop only */}
                      <div className="hidden md:block text-[10px] uppercase tracking-[0.18em] text-editorial-label whitespace-nowrap w-28 shrink-0 pt-1.5">
                        {formatDate(entry.date)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-available mb-1.5">
                          {entry.type === "weeknote"
                            ? `Weekly Log · Week #${entry.weeknoteCount}`
                            : entry.tags || "Essay"}
                          <span className="md:hidden text-editorial-label ml-2">
                            · {formatDate(entry.date)}
                          </span>
                        </div>
                        <h3 className="text-lg md:text-2xl font-display font-bold text-editorial-text leading-tight group-hover:opacity-70 transition-opacity">
                          {entry.title}
                        </h3>
                      </div>

                      {/* Arrow */}
                      <div className="text-editorial-label pt-1 md:pt-1.5 shrink-0 group-hover:text-editorial-text transition-colors text-sm">
                        ↗
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between md:justify-start gap-4 pt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="text-[10px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      ← Prev
                    </button>

                    <div className="hidden md:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-7 h-7 text-[10px] tracking-[0.1em] transition-colors cursor-pointer ${
                              p === page
                                ? "text-editorial-text border-b border-editorial-text"
                                : "text-editorial-label hover:text-editorial-text"
                            }`}
                          >
                            {String(p).padStart(2, "0")}
                          </button>
                        )
                      )}
                    </div>

                    <span className="md:hidden text-[10px] uppercase tracking-[0.2em] text-editorial-label">
                      {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                    </span>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="text-[10px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}> = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex justify-between items-baseline w-full text-left cursor-pointer transition-colors ${
      active
        ? "text-available"
        : "text-editorial-text hover:text-editorial-label"
    }`}
  >
    <span className={`text-sm font-display font-bold ${active ? "italic" : ""}`}>
      {label}
    </span>
    <span className="text-[10px] text-editorial-label font-primary font-normal tabular-nums">
      {count}
    </span>
  </button>
);

export default ArchivePage;
