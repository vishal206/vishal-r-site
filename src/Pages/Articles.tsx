import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getBlogPostsSync } from "../Utils/functions";
import { tagFromParam } from "../Utils/articleTags";
import { usePageViews } from "../hooks/usePageViews";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

interface UnifiedEntry {
  slug: string;
  title: string;
  date: string;
  tags?: string;
  image?: string;
  type: "blog";
}

const Articles: React.FC = () => {
  const blogs = useMemo(() => getBlogPostsSync(), []);
  // The classification comes from ?tag= (set by the nav's Articles dropdown).
  const [searchParams] = useSearchParams();
  const tag = tagFromParam(searchParams.get("tag"));
  // Pagination is remembered per tag, so switching tags starts back at page 1.
  const [paging, setPaging] = useState({ tag, page: 1 });
  const page = paging.tag === tag ? paging.page : 1;
  const setPage = (p: number) => setPaging({ tag, page: p });
  const PAGE_SIZE = 10;

  const blogEntries: UnifiedEntry[] = blogs.map((b) => ({
    slug: b.slug,
    title: b.title,
    date: b.date,
    tags: b.tags,
    image: b.image,
    type: "blog",
  }));

  const filteredEntries = blogEntries
    .filter((e) => e.tags?.toLowerCase() === tag)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const pagedEntries = filteredEntries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // Only the visible page's slugs are queried — keeps reads minimal and stays
  // under Firestore's 30-value `in` limit (page size is 10).
  const pageSlugs = useMemo(
    () => pagedEntries.map((e) => e.slug),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagedEntries.map((e) => e.slug).join(",")],
  );
  const views = usePageViews(pageSlugs);

  return (
    <div className="pb-6">
    {filteredEntries.length === 0 ? (
      <div className="text-editorial-label text-sm py-6">
        No entries found.
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
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

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-available">
                  {entry.tags || "Essay"}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-editorial-label tabular-nums">
                  <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                  {(views[entry.slug] ?? 0).toLocaleString()}
                </span>
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
              onClick={() => setPage(Math.max(1, page - 1))}
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
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="text-[10px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              Next →
            </button>
          </div>
        )}
      </>
    )}
    </div>
  );
};

export default Articles;
