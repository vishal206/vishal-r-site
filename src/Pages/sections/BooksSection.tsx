import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Book3D from "../../components/Book3D";
import { getBooksSync } from "../../Utils/markdownLoader";
import type { Book as BookType } from "../../Utils/markdownLoader";
import { media } from "../../Utils/media";
import type { MediaBook } from "../../Utils/media";

/** A media.json entry dressed as a Book so Book3D can render it — cover from
 *  the API art, typographic spine/cover fallbacks for the rest. */
const toBook = (m: MediaBook): BookType => ({
  slug: m.post ?? m.title,
  title: m.title,
  author: m.author,
  genres: [],
  review: "",
  accent: m.accent,
  cover: m.image ?? undefined,
});

type Shelved = { book: BookType; to: string | null };

/**
 * Books stacked like they're leaning on a table: each one overlaps the next so
 * mostly spines show. Hovering a book turns it front-on and slides everything
 * after it out of the way so the full cover is visible.
 */
const Shelf: React.FC<{ items: Shelved[] }> = ({ items }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex flex-wrap justify-center gap-y-12 md:gap-y-16 pt-12 md:pt-16 items-end">
      {items.map(({ book, to }, i) => {
        const shifted = hovered !== null && i > hovered;
        const inner = (
          <Book3D
            book={book}
            height={{ base: 200, md: 260 }}
            tiltDeg={30}
            hoverTiltDeg={6}
          />
        );
        return (
          <div
            key={book.slug}
            className={`relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              i === 0 ? "" : "-ml-[86px] md:-ml-[116px]"
            } ${shifted ? "translate-x-[86px] md:translate-x-[116px]" : ""}`}
            // Later books stack on top, so the visible slice of each is its
            // spine edge; the hovered one jumps above its right-hand neighbour.
            style={{ zIndex: hovered === i ? 60 : i + 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            {to ? (
              <Link to={to} className="group block">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </div>
        );
      })}
    </div>
  );
};

const BooksSection: React.FC = () => {
  // The read shelf is driven by media.json. Entries whose `post` matches a
  // review get the full reviewed book (real cover, spine, link); the rest
  // render from their API art alone. Reviewed books missing from media.json
  // still show, so the two sources can't drift apart silently.
  const { read, wishlist } = useMemo(() => {
    const reviewed = getBooksSync();
    const bySlug = new Map(reviewed.map((b) => [b.slug, b]));

    const read: Shelved[] = media.books.read.map((m) => {
      const book = m.post ? bySlug.get(m.post) : undefined;
      return book
        ? { book, to: `/book/${book.slug}` }
        : { book: toBook(m), to: null };
    });

    const listed = new Set(media.books.read.map((m) => m.post));
    for (const b of reviewed)
      if (!listed.has(b.slug)) read.unshift({ book: b, to: `/book/${b.slug}` });

    return { read, wishlist: media.books.wishlist.map(toBook) };
  }, []);

  return (
    <div className="flex-1 px-6 md:px-12 pb-10 max-w-screen-xl mx-auto w-full">
      {read.length === 0 ? (
        <div className="text-center text-editorial-label text-sm py-16">
          No books yet.
        </div>
      ) : (
        <Shelf items={read} />
      )}

      {wishlist.length > 0 && (
        <>
          <div className="text-center text-editorial-label text-xs uppercase tracking-[0.3em] pt-16">
            Wishlist
          </div>
          <Shelf items={wishlist.map((book) => ({ book, to: null }))} />
        </>
      )}
    </div>
  );
};

export default BooksSection;
