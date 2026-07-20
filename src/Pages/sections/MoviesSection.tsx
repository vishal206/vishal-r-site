import React, { useMemo, useState } from "react";
import MovieDisk from "../../components/MovieDisk";
import { getBlogPostsSync } from "../../Utils/functions";
import type { BlogPostMeta } from "../../Utils/markdownLoader";
import { media } from "../../Utils/media";
import type { MediaMovie } from "../../Utils/media";

type Category = "reviewed" | "watched" | "wishlist";
type Filter = "all" | Category;

type Shelved = {
  post: BlogPostMeta;
  to: string | null;
  category: Category;
};

/** A media.json entry dressed as a blog post so MovieDisk can render it. */
const toPost = (m: MediaMovie): BlogPostMeta => ({
  slug: m.post ?? m.title,
  title: m.title,
  date: "",
  image: m.image ?? undefined,
  tags: "Movie",
  description: "",
});

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reviewed", label: "Reviewed" },
  { key: "watched", label: "Watched" },
  { key: "wishlist", label: "To Be Watched" },
];

const MoviesSection: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("all");

  // One flat list of every movie tagged by category. A watched entry whose
  // `post` points at a review is promoted to `reviewed`, so none is counted
  // twice — mirroring how BooksSection folds `read` into `reviewed`.
  const movies = useMemo<Shelved[]>(() => {
    const reviewed = getBlogPostsSync().filter((p) => p.tags === "Movie");
    const reviewedSlugs = new Set(reviewed.map((p) => p.slug));

    const reviewedShelf: Shelved[] = reviewed.map((p) => ({
      post: p,
      to: `/archive/${p.slug}`,
      category: "reviewed",
    }));

    const watchedShelf: Shelved[] = media.movies.watched
      .filter((m) => !(m.post && reviewedSlugs.has(m.post)))
      .map((m) => ({
        post: toPost(m),
        to: m.post ? `/archive/${m.post}` : null,
        category: "watched",
      }));

    const wishlistShelf: Shelved[] = media.movies.wishlist.map((m) => ({
      post: toPost(m),
      to: null,
      category: "wishlist",
    }));

    return [...reviewedShelf, ...watchedShelf, ...wishlistShelf];
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: 0,
      reviewed: 0,
      watched: 0,
      wishlist: 0,
    };
    for (const m of movies) {
      c[m.category] += 1;
      c.all += 1;
    }
    return c;
  }, [movies]);

  const visible =
    filter === "all" ? movies : movies.filter((m) => m.category === filter);

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
          No movies yet.
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-12 md:gap-20 pt-12 md:pt-16 items-end">
          {visible.map((item, i) => (
            <MovieDisk
              key={`${item.category}-${item.post.slug}`}
              post={item.post}
              to={item.to}
              tilt={i % 2 === 0 ? -5 : 4}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MoviesSection;
