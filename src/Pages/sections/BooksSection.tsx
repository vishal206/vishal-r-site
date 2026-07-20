import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BookCover from "../../components/BookCover";
import { getBooksSync } from "../../Utils/markdownLoader";
import type { Book as BookType } from "../../Utils/markdownLoader";
import { media } from "../../Utils/media";
import type { MediaBook } from "../../Utils/media";

type Category = "reviewed" | "read" | "wishlist";
type Filter = "all" | Category;

type Shelved = {
  book: BookType;
  to: string | null;
  category: Category;
  volumes: number; // total count (a set counts as its number of volumes)
  covers?: string[]; // per-volume cover URLs when this is a set
};

/** A media.json entry dressed as a Book so BookCover can render it. */
const toBook = (m: MediaBook): BookType => ({
  slug: m.post ?? m.title,
  title: m.title,
  author: m.author,
  genres: [],
  review: "",
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

/**
 * A book cover. The typographic placeholder (BookCover's no-image fallback)
 * shows immediately, so there's never blank space while the real cover loads —
 * it fades in on top once ready, and stays hidden if the image fails to load.
 */
const Cover: React.FC<{ book: BookType; volumes: number }> = ({
  book,
  volumes,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(book.cover) && !failed;

  return (
    <div
      // Until the real cover is up, hold a standard 2:3 box for the placeholder;
      // once loaded the image's natural height drives the card (the masonry look).
      className={`relative w-full rounded-md overflow-hidden shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:-translate-y-1 ${
        showImg && loaded ? "" : "aspect-[2/3]"
      }`}
    >
      {(!showImg || !loaded) && <BookCover book={{ ...book, cover: undefined }} />}
      {showImg && (
        <img
          src={book.cover}
          alt={book.title}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-auto block transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {volumes > 1 && (
        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-medium tracking-wide backdrop-blur-sm">
          ×{volumes}
        </span>
      )}
    </div>
  );
};

// How long each volume holds focus before the deck rolls to the next.
const PILE_INTERVAL = 1800;
// How many upcoming volumes peek out behind the focus card.
const PILE_PEEK = 3;

/**
 * A set rendered as a rolling deck: the focus cover sits in front, the next few
 * volumes peek out above and behind it, and on a loop the front card rolls back
 * into the stack as the next one comes forward — first to last, then repeats.
 */
const VolumePile: React.FC<{ covers: string[]; alt: string }> = ({
  covers,
  alt,
}) => {
  const [active, setActive] = useState(0);
  const n = covers.length;

  useEffect(() => {
    if (n < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % n), PILE_INTERVAL);
    return () => clearInterval(id);
  }, [n]);

  const exitSlot = n - 1;

  return (
    <div className="relative aspect-[2/3] w-full transition-transform duration-300 group-hover:-translate-y-1">
      {covers.map((src, i) => {
        // Slot 0 is the focus. Slots 1..PEEK are the upcoming volumes peeking
        // up-and-right behind it (top-right corners showing). The last slot is
        // the card that just left focus — it rolls out toward the bottom-left,
        // shrinking away, then loops back in at the top-right end of the deck.
        const slot = (i - active + n) % n;
        const isExit = slot === exitSlot;
        const depth = Math.min(slot, PILE_PEEK);

        let transform: string;
        let opacity: number;
        if (slot === 0) {
          transform = "translate(0px, 0px) scale(1)";
          opacity = 1;
        } else if (isExit) {
          // The roll-off: down to the bottom-left, shrinking, fading out.
          transform = "translate(-30px, 34px) scale(0.42)";
          opacity = 0;
        } else {
          // Upcoming peeks (and, past PEEK, the invisible cards waiting to
          // re-enter — parked at the furthest peek spot so re-entry is in place).
          transform = `translate(${depth * 11}px, ${-depth * 11}px) scale(${1 - depth * 0.06})`;
          opacity = slot <= PILE_PEEK ? 1 - depth * 0.22 : 0;
        }

        // A card leaving the exit slot must not fly across the deck from
        // bottom-left to top-right. It came from the exit already invisible, so
        // freeze its transform (snap into place) and only fade it in.
        const cameFromExit = n >= 3 && slot === exitSlot - 1;
        const transition = cameFromExit
          ? "opacity 650ms ease"
          : "transform 650ms cubic-bezier(0.22,1,0.36,1), opacity 650ms ease";

        return (
          <img
            key={src}
            src={src}
            alt={`${alt} — volume ${i + 1}`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_14px_28px_-16px_rgba(0,0,0,0.85)]"
            style={{
              transform,
              opacity,
              zIndex: isExit ? n + 1 : n - slot,
              transition,
              willChange: "transform, opacity",
            }}
          />
        );
      })}
      <span className="absolute top-1.5 right-1.5 z-[999] px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-medium tracking-wide backdrop-blur-sm">
        ×{n}
      </span>
    </div>
  );
};

const BookCard: React.FC<{ item: Shelved }> = ({ item }) => {
  const cover =
    item.covers && item.covers.length > 0 ? (
      <VolumePile covers={item.covers} alt={item.book.title} />
    ) : (
      <Cover book={item.book} volumes={item.volumes} />
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
      volumes: 1,
    }));

    const readShelf: Shelved[] = media.books.read
      .filter((m) => !(m.post && reviewedSlugs.has(m.post)))
      .map((m) => ({
        book: toBook(m),
        to: m.post ? `/book/${m.post}` : null,
        category: "read",
        volumes: m.volumes?.length ?? 1,
        covers: m.volumes,
      }));

    const wishlistShelf: Shelved[] = media.books.wishlist.map((m) => ({
      book: toBook(m),
      to: null,
      category: "wishlist",
      volumes: m.volumes?.length ?? 1,
      covers: m.volumes,
    }));

    return [...reviewedShelf, ...readShelf, ...wishlistShelf];
  }, []);

  // Tallies count total volumes, so a 20-volume set adds 20 rather than 1.
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: 0,
      reviewed: 0,
      read: 0,
      wishlist: 0,
    };
    for (const b of books) {
      c[b.category] += b.volumes;
      c.all += b.volumes;
    }
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
