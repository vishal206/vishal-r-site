import React, { useMemo } from "react";
import MovieDisk from "../../components/MovieDisk";
import { getBlogPostsSync } from "../../Utils/functions";

const MoviesSection: React.FC = () => {
  const movies = useMemo(
    () => getBlogPostsSync().filter((p) => p.tags === "Movie"),
    [],
  );

  return (
    <div className="flex-1 px-6 md:px-12 pb-10 max-w-screen-xl mx-auto w-full">
      {movies.length === 0 ? (
        <div className="text-center text-editorial-label text-sm py-16">
          No movies yet.
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-12 md:gap-20 pt-12 md:pt-16 items-end">
          {movies.map((post, i) => (
            <MovieDisk key={post.slug} post={post} tilt={i % 2 === 0 ? -5 : 4} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MoviesSection;
