import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BlogPostMeta } from "../Utils/markdownLoader";
import { fetchBlogPosts } from "../Utils/functions";

const BlogList = () => {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogPosts(setError, setLoading, setPosts);
  }, []);

  if (loading)
    return (
      <div className={`flex justify-center items-center h-full  text-primary`}>
        <p className="text-lg font-serif">Loading posts...</p>
      </div>
    );

  return (
    <div className={`blog-list h-full overflow-x-auto`}>
      {error && <p className="text-red-500 font-sans text-sm mb-4">{error}</p>}

      {posts.length === 0 ? (
        <div className="text-gray-600 font-sans">
          <p>No posts found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure your markdown files are in the correct location and
            properly formatted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 pb-4">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="flex flex-col flex-none md:w-[90%] w-[9rem] duration-300"
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group block transition-all h-full"
              >
                {/* Square image container */}
                <div className="aspect-3/2 w-full overflow-hidden">
                  {post.image ? (
                    <div className="w-full h-full overflow-hidden rounded-xl">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 rounded-xl group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                </div>

                {/* Content section */}
                <div className="flex flex-col flex-grow">
                  {post.tags && (
                    <div className="mb-2">
                      <span className="text-xs uppercase tracking-wider text-gray-700 rounded">
                        {post.tags}
                      </span>
                    </div>
                  )}

                  <h2 className="md:text-xl text-base font-sans transition-colors line-clamp-2 group-hover:underline ">
                    {post.title}
                  </h2>

                  <div
                    className={`text-secondary text-xs font-sans uppercase tracking-wider mt-auto`}
                  >
                    {post.date}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
