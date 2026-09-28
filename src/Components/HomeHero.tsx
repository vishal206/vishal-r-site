import LatestArticles from "./LatestArticles";
import MovieShelf from "./MovieShelf";

// The home screen that always sits behind the section sheet: the latest
// articles and the movie shelf, in its own scroll container, below the site
// header.
const HomeHero = ({ onMoreArticles }: { onMoreArticles: () => void }) => (
  <div className="absolute inset-0 overflow-y-auto">
    <div className="px-6 md:px-12 pt-6 md:pt-8 pb-16 max-w-screen-xl mx-auto">
      {/* ── Latest articles ── */}
      <LatestArticles onMore={onMoreArticles} />

      {/* ── Movies: watched, then wishlist ── */}
      <MovieShelf />
    </div>
  </div>
);

export default HomeHero;
