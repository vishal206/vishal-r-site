import { useMemo } from "react";
import FeaturedArticles from "./FeaturedArticles";
import { FEATURED_COUNT, getLatestArticles } from "../Utils/articles";

// The newest writing on the home page: the featured block (see
// FeaturedArticles) under a heading with a way through to the whole archive.
// Movie reviews are left out, as in the archive — they hang on the movie shelf.
const LatestArticles = ({ onMore }: { onMore: () => void }) => {
  const posts = useMemo(() => getLatestArticles(FEATURED_COUNT), []);

  if (posts.length === 0) return null;

  return (
    <section className="pb-12 md:pb-16">
      {/* ── Heading row: the label, and the way through to the archive ── */}
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-available">
          Articles I wrote
        </div>
        <button
          type="button"
          onClick={onMore}
          className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-editorial-label transition-colors hover:text-editorial-text"
        >
          More articles →
        </button>
      </div>

      <FeaturedArticles posts={posts} />
    </section>
  );
};

export default LatestArticles;
