import React, { useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import BookShelf from "../components/BookShelf";
import { getBooksSync } from "../Utils/markdownLoader";

const BooksPage: React.FC = () => {
  // Eager-bundled markdown → resolve synchronously so prerender and the client's
  // first render match.
  const books = useMemo(() => getBooksSync(), []);
  const [filter, setFilter] = useState("All");

  // Unique genres across the shelf, in first-seen order.
  const genres = useMemo(() => {
    const seen: string[] = [];
    for (const b of books)
      for (const g of b.genres) if (!seen.includes(g)) seen.push(g);
    return seen;
  }, [books]);

  const filtered = useMemo(
    () => (filter === "All" ? books : books.filter((b) => b.genres.includes(filter))),
    [books, filter],
  );

  const filters = ["All", ...genres];

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary flex flex-col">
      <SiteHeader activePage="books" />

      {/* ── Genre filter ── */}
      <div className="flex justify-center flex-wrap gap-2 mt-5 md:mt-6 px-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] border transition-colors cursor-pointer ${
              filter === f
                ? "border-available text-available"
                : "border-editorial-divider text-editorial-label hover:border-editorial-label"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Shelf ── */}
      <div className="flex-1 flex flex-col justify-center py-4 md:py-5">
        {filtered.length === 0 ? (
          <div className="text-center text-editorial-label text-sm">
            No books in this genre yet.
          </div>
        ) : (
          <BookShelf key={filter} books={filtered} />
        )}
      </div>
    </div>
  );
};

export default BooksPage;
