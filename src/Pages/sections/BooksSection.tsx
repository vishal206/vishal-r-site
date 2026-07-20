import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BookCover from "../../components/BookCover";
import { getBooksSync } from "../../Utils/markdownLoader";
import type { Book as BookType } from "../../Utils/markdownLoader";
import { media } from "../../Utils/media";
import type { MediaBook } from "../../Utils/media";

type Category = "reviewed" | "read" | "wishlist";
type Filter = "all" | Category;

type Shelved = { book: BookType; to: string | null; category: Category };

/** A media.json entry dressed as a Book so BookCover can render it. */
const toBook = (m: MediaBook): BookType => ({
  slug: m.post ?? m.title,
  title: m.title,
  author: m.author,
  genres: [],
  review: "",
  accent: m.accent,
  cover: m.image ?? undefined,
});

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reviewed", label: "Reviewed" },
  { key: "read", label: "Read" },
  { key: "wishlist", label: "To Be Read" },
];

// Each book gets a random display size for a livelier, less uniform grid. It's
// derived from the slug (not Math.random) so a given book always lands the same
// size — no reshuffle on re-render or when the filter changes. Widths only, so
// covers scale proportionally and never distort.
const SIZE_SCALES = [0.7, 0.8, 0.9, 1];
const scaleFor = (slug: string) => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return SIZE_SCALES[hash % SIZE_SCALES.length];
};

const BookCard: React.FC<{ item: Shelved }> = ({ item }) => {
  const shared =
    "w-full block rounded-md overflow-hidden shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:-translate-y-1";

  // With a cover we render the image at its natural height, so each card takes
  // the book's real proportions (the masonry look). Without one, the
  // typographic fallback needs an explicit box, so it gets a standard 2:3.
  const cover = item.book.cover ? (
    <img src={item.book.cover} alt={item.book.title} draggable={false} className={shared} />
  ) : (
    <div className={`relative aspect-[2/3] ${shared}`}>
      <BookCover book={item.book} />
    </div>
  );

  return (
    <div className="group flex flex-col gap-2.5">
      {item.to ? (
        <Link to={item.to} className="block">
          {cover}
        </Link>
      ) : (
        cover
      )}
      <div className="text-center leading-snug">
        <div className="text-editorial-text/90 text-[11px] line-clamp-2">
          {item.book.title}
        </div>
        {item.book.author && (
          <div className="text-editorial-label text-[9px] mt-0.5 line-clamp-1">
            {item.book.author}
          </div>
        )}
      </div>
    </div>
  );
};

const BooksSection: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("all");

  // One flat list of every book tagged by category. A read entry whose `post`
  // points at a review is promoted to `reviewed`, so no book is counted twice.
  const books = useMemo<Shelved[]>(() => {
    const reviewed = getBooksSync();
    const reviewedSlugs = new Set(reviewed.map((b) => b.slug));

    const reviewedShelf: Shelved[] = reviewed.map((b) => ({
      book: b,
      to: `/book/${b.slug}`,
      category: "reviewed",
    }));

    const readShelf: Shelved[] = media.books.read
      .filter((m) => !(m.post && reviewedSlugs.has(m.post)))
      .map((m) => ({
        book: toBook(m),
        to: m.post ? `/book/${m.post}` : null,
        category: "read",
      }));

    const wishlistShelf: Shelved[] = media.books.wishlist.map((m) => ({
      book: toBook(m),
      to: null,
      category: "wishlist",
    }));

    return [...reviewedShelf, ...readShelf, ...wishlistShelf];
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: books.length,
      reviewed: 0,
      read: 0,
      wishlist: 0,
    };
    for (const b of books) c[b.category]++;
    return c;
  }, [books]);

  const visible =
    filter === "all" ? books : books.filter((b) => b.category === filter);

  return (
    <div className="flex-1 px-6 md:px-12 pb-10 max-w-screen-xl mx-auto w-full">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {FILTERS.map(({ key, label }) => {
          if (key !== "all" && counts[key] === 0) return null;
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.2em] transition-colors ${
                active
                  ? "bg-editorial-text text-editorial-bg"
                  : "text-editorial-label hover:text-editorial-text"
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-60">{counts[key]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      {visible.length === 0 ? (
        <div className="text-center text-editorial-label text-sm py-16">
          No books yet.
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5 lg:gap-10 pt-10">
          {visible.map((item) => (
            <div
              key={`${item.category}-${item.book.slug}`}
              className="mb-9 lg:mb-12 break-inside-avoid mx-auto"
              style={{ width: `${scaleFor(item.book.slug) * 100}%` }}
            >
              <BookCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksSection;
