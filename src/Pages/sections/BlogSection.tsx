import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogPostsSync } from "../../Utils/functions";

type FilterType = "all" | string;

interface UnifiedEntry {
  slug: string;
  title: string;
  date: string;
  tags?: string;
  image?: string;
  type: "blog";
}

const TAGS = ["Devlog", "Tech", "Life"];
const ALL_FILTERS = [
  { key: "all", label: "All Entries" },
  ...TAGS.map((t) => ({ key: t, label: t })),
];

const BlogSection: React.FC = () => {
  // Movies live in their own section — keep them out of the blog.
  const blogs = useMemo(
    () => getBlogPostsSync().filter((b) => b.tags !== "Movie"),
    [],
  );
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const blogEntries: UnifiedEntry[] = blogs.map((b) => ({
    slug: b.slug,
    title: b.title,
    date: b.date,
    tags: b.tags,
    image: b.image,
    type: "blog",
  }));

  const allEntries = [...blogEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const getCount = (f: FilterType) => {
    if (f === "all") return allEntries.length;
    return blogEntries.filter((e) => e.tags?.toLowerCase() === f.toLowerCase())
      .length;
  };

  const filteredEntries =
    filter === "all"
      ? allEntries
      : blogEntries.filter(
          (e) => e.tags?.toLowerCase() === filter.toLowerCase(),
        );

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const pagedEntries = filteredEntries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <div className="px-6 md:px-12 pb-6 max-w-screen-xl mx-auto w-full">
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
      <div className="flex flex-col md:flex-row">
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
          {filteredEntries.length === 0 ? (
            <div className="text-editorial-label text-sm py-6">
              No entries found.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                {pagedEntries.map((entry) => (
                  <Link
                    key={`${entry.type}-${entry.slug}`}
                    to={`/archive/${entry.slug}`}
                    className="group flex flex-col"
                  >
                    {entry.image && (
                      <div className="aspect-[21/9] w-full overflow-hidden rounded-xl mb-4">
                        <img
                          src={entry.image}
                          alt={entry.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="text-[10px] uppercase tracking-[0.2em] text-available mb-2">
                      {entry.tags || "Essay"}
                    </div>
                    <h3 className="text-lg md:text-xl font-display font-bold text-editorial-text leading-tight group-hover:opacity-70 transition-opacity">
                      {entry.title}
                    </h3>
                  </Link>
                ))}
              </div>

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
                      ),
                    )}
                  </div>

                  <span className="md:hidden text-[10px] uppercase tracking-[0.2em] text-editorial-label">
                    {String(page).padStart(2, "0")} /{" "}
                    {String(totalPages).padStart(2, "0")}
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

export default BlogSection;
