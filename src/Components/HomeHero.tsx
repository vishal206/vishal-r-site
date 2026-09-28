import LatestArticles from "./LatestArticles";
import MovieShelf from "./MovieShelf";
import SiteHeader from "./SiteHeader";

// The home screen that always sits behind the section sheet: the site header,
// the latest articles and the movie shelf, in its own scroll container — the
// header scrolls away with the rest.
const HomeHero = ({
  onHome,
  onMoreArticles,
}: {
  onHome: () => void;
  onMoreArticles: () => void;
}) => (
  <div className="absolute inset-0 overflow-y-auto">
    <SiteHeader onHome={onHome} />
    <div className="px-6 md:px-12 pt-6 md:pt-8 pb-16 max-w-screen-xl mx-auto">
      {/* ── Latest articles ── */}
      <LatestArticles onMore={onMoreArticles} />

      {/* ── Movies: watched, then wishlist ── */}
      <MovieShelf />
    </div>
  </div>
);

export default HomeHero;
