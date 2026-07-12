import React, { useMemo } from "react";
import SiteHeader from "../components/SiteHeader";
import MovieDisk from "../components/MovieDisk";
import { getBlogPostsSync } from "../Utils/functions";

const MoviesPage: React.FC = () => {
  // Eager-bundled markdown → resolve synchronously so the prerendered HTML and
  // the client's first render match. Movies are blog posts tagged "Movie".
  const movies = useMemo(
    () => getBlogPostsSync().filter((p) => p.tags === "Movie"),
    [],
  );

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary flex flex-col">
      <SiteHeader activePage="movies" />

      {/* ── Disk grid ── */}
      <div className="flex-1 px-6 md:px-12 pb-10 max-w-screen-xl mx-auto w-full">
        {movies.length === 0 ? (
          <div className="text-center text-editorial-label text-sm py-16">
            No movies yet.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 pt-12 md:pt-16 items-end">
            {movies.map((post, i) => (
              <MovieDisk
                key={post.slug}
                post={post}
                tilt={i % 2 === 0 ? -5 : 4}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
