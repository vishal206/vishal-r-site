import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import { loadBookFileSync } from "../Utils/markdownLoader";

/** Minimal inline markdown for the review body: **bold** and *italic*. */
const renderInline = (text: string) =>
  text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((seg, i) => {
    if (/^\*\*[^*]+\*\*$/.test(seg))
      return <strong key={i}>{seg.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(seg)) return <em key={i}>{seg.slice(1, -1)}</em>;
    return seg;
  });

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
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

  const paragraphs = useMemo(
    () =>
      (book?.review ?? "")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    [book],
  );

  if (!book) {
    return (
      <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
        <SiteHeader activePage="books" />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <p className="text-editorial-label mb-6">Book not found.</p>
          <Link to="/books" className="text-available uppercase tracking-[0.2em] text-xs">
            ← Back to the shelf
          </Link>
        </div>
      </div>
    );
  }

  const accent = book.accent ?? "#9ca3af";

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
      <SiteHeader activePage="books" />
      <article className="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-16">
        <Link
          to="/books"
          className="inline-block text-[10px] uppercase tracking-[0.22em] text-editorial-label hover:text-editorial-text transition-colors mb-10"
        >
          ← The Reading Shelf
        </Link>

        {/* ── Hero ── */}
        <header className="flex flex-col sm:flex-row gap-7 md:gap-10 items-start">
          <div
            className="relative w-32 md:w-44 shrink-0 rounded-[3px] overflow-hidden"
            style={{
              aspectRatio: "2 / 3",
              background: book.cover ? "#0e0e0e" : accent,
              boxShadow: "0 26px 50px -20px rgba(0,0,0,0.85)",
            }}
          >
            {book.cover && (
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            )}
          </div>

          <div className="min-w-0">
            <div
              className="uppercase tracking-[0.24em] text-[10px] mb-3"
              style={{ color: accent }}
            >
              Book · Review
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl leading-[1.05]">
              {book.title}
            </h1>
            <div className="mt-3 font-body italic text-editorial-muted text-base md:text-lg">
              by {book.author}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-5">
              {book.genres.map((g) => (
                <span
                  key={g}
                  className="text-[9px] uppercase tracking-[0.16em] text-editorial-muted border border-editorial-divider px-2 py-0.5 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
            {formatDate(book.date) && (
              <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-label mt-4">
                {formatDate(book.date)}
              </div>
            )}
          </div>
        </header>

        <div className="h-px bg-editorial-divider my-10" />

        {/* ── Review ── */}
        <div className="font-body text-[15px] md:text-[17px] leading-relaxed text-editorial-text/90 space-y-5">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.8]"
                  : ""
              }
            >
              {renderInline(para)}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
};

export default BookPage;
