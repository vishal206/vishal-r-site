import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { CustomMarkdownReader } from "../components/CustomMarkdownReader";
import { loadBookFileSync, getBooksSync } from "../Utils/markdownLoader";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr.toUpperCase()
    : d
        .toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase();
};

const BookPage: React.FC = () => {
  const { slug = "" } = useParams();
  const book = useMemo(() => loadBookFileSync(slug), [slug]);

  // Other books on the shelf — a window of up to 2 newer + current + 2 older,
  // newest first (mirrors the blog reader's "In This Archive" rail).
  const shelf = useMemo(() => {
    const all = getBooksSync();
    const idx = all.findIndex((b) => b.slug === slug);
    if (idx === -1) return all.slice(0, 5);
    return all.slice(Math.max(0, idx - 2), idx + 3);
  }, [slug]);

  if (!book) {
    return (
      <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
        <SiteHeader activePage="books" />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <p className="text-editorial-label mb-6">Book not found.</p>
          <Link
            to="/books"
            className="text-available uppercase tracking-[0.2em] text-xs"
          >
            ← Back to the shelf
          </Link>
        </div>
      </div>
    );
  }

  const sublabel = [book.author, formatDate(book.date)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
      <SiteHeader activePage="books" />
      <div className="px-6 md:px-12 pb-6 max-w-screen-xl mx-auto">
        {/* ── Article header ── */}
        <div className="pt-10 md:pt-14 pb-8 md:pb-12 border-b border-editorial-divider">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[10px] uppercase tracking-[0.22em] text-available">
              Book
            </span>
            {sublabel && (
              <>
                <div className="w-8 h-px bg-editorial-divider shrink-0" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-editorial-label hidden sm:block">
                  {sublabel}
                </span>
              </>
            )}
          </div>

          {/* Title with a small square thumbnail on the right */}
          <div className="flex items-start gap-5 md:gap-8">
            <h1 className="flex-1 min-w-0 text-4xl md:text-6xl lg:text-7xl font-display font-black text-editorial-text leading-[1.05]">
              {book.title}
            </h1>
            {book.cover && (
              <img
                src={book.cover}
                alt={book.title}
                className="shrink-0 w-20 h-20 md:w-28 md:h-28 object-cover rounded-xl"
              />
            )}
          </div>

          {book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-6">
              {book.genres.map((g) => (
                <span
                  key={g}
                  className="text-[9px] uppercase tracking-[0.16em] text-editorial-muted border border-editorial-divider px-2 py-0.5 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col md:flex-row gap-0">
          {/* Bookshelf rail */}
          {shelf.length > 0 && (
            <aside className="hidden md:block w-52 shrink-0 border-r border-editorial-divider pr-8 pt-12">
              <div className="text-[9px] uppercase tracking-[0.22em] text-editorial-label mb-5">
                Bookshelf
              </div>
              <div>
                {shelf.map((b) => {
                  const isCurrent = b.slug === slug;
                  return (
                    <div
                      key={b.slug}
                      className={`py-4 border-b border-editorial-divider transition-opacity ${isCurrent ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
                    >
                      {isCurrent ? (
                        <>
                          <div className="text-[9px] uppercase tracking-[0.18em] text-available mb-1">
                            Reading
                          </div>
                          <p className="text-sm font-display font-bold text-editorial-text leading-tight">
                            {b.title}
                          </p>
                        </>
                      ) : (
                        <Link to={`/book/${b.slug}`} className="block group">
                          <div className="text-[9px] uppercase tracking-[0.18em] text-editorial-label mb-1 line-clamp-1">
                            {[b.genres[0], formatDate(b.date)]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                          <p className="text-sm font-display font-bold text-editorial-text leading-tight group-hover:opacity-70 transition-opacity line-clamp-2">
                            {b.title}
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
          <article className="flex-1 md:pl-12 md:pr-12 pt-10 md:pt-12 max-w-3xl">
            <CustomMarkdownReader content={book.review} />
          </article>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default BookPage;
