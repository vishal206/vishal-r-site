import { useMemo } from "react";
import { Link } from "react-router-dom";
import ArticleCard from "./ArticleCard";
import { getLatestArticles } from "../Utils/articles";

const COUNT = 2;

/**
 * The reader's side rail, under "On this page": the two latest articles
 * (never the one being read), headed by the way through to the rest.
 */
const RailArticles = ({ currentSlug }: { currentSlug?: string }) => {
  const posts = useMemo(
    () => getLatestArticles(COUNT, currentSlug),
    [currentSlug],
  );

  if (posts.length === 0) return null;

  return (
    <section>
      <Link
        to="/article"
        className="mb-4 inline-block text-[9px] uppercase tracking-[0.2em] text-editorial-label transition-colors hover:text-editorial-text"
      >
        More articles →
      </Link>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} compact />
        ))}
      </div>
    </section>
  );
};

export default RailArticles;
