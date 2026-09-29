import { useMemo } from "react";
import ArticleCard from "../../components/ArticleCard";
import FeaturedArticles from "../../components/FeaturedArticles";
import { FEATURED_COUNT, getLatestArticles } from "../../Utils/articles";

// The full article list, laid out like the home page: the newest post as a
// large card with the next four in two columns beside it, then every other
// article below in rows of four. Movie reviews are left out — they hang on the
// home page's movie shelf.
const BlogSection = () => {
  const posts = useMemo(() => getLatestArticles(), []);
  const top = posts.slice(0, FEATURED_COUNT);
  const rest = posts.slice(FEATURED_COUNT);

  return (
    <div className="px-6 md:px-12 pb-6 max-w-screen-xl mx-auto w-full">
      {posts.length === 0 ? (
        <div className="text-editorial-label text-sm py-6">
          No entries found.
        </div>
      ) : (
        <>
          <FeaturedArticles posts={top} showAllBelowLg />

          {rest.length > 0 && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogSection;
