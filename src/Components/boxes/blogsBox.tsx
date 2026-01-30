import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BlogPostMeta } from "../../Utils/markdownLoader";
import { fetchBlogPosts } from "../../Utils/functions";

const BlogsBox: React.FC = () => {
  const navigate = useNavigate();
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
    <div className={`bg-secondarybg rounded-3xl p-6 h-full`}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 items-start justify-start">
        <h2
          className={`text-base md:text-2xl font-primary font-black text-highlight tracking-widest`}
        >
          Blogs
        </h2>
        <button
          onClick={() => navigate("/?section=blog")}
          className={`flex justify-start md:justify-end w-full font-primary font-black text-highlight text-[10px] md:text-xs hover:tracking-widest transition-all self-center cursor-pointer`}
        >
          Find More Blogs I wrote {">>>>"}
        </button>
      </div>
      <div className="md:max-h-96 max-h-64 overflow-y-auto">
        <div className={`blog-list h-full overflow-x-auto`}>
          {error && (
            <p className="text-red-500 font-sans text-sm mb-4">{error}</p>
          )}

          {posts.length === 0 ? (
            <div className="text-gray-600 font-sans">
              <p>No posts found.</p>
              <p className="text-sm text-gray-500 mt-2">
                Make sure your markdown files are in the correct location and
                properly formatted.
              </p>
            </div>
          ) : (
            <div className="flex flex-row overflow-x-auto gap-6">
              {posts.map((post) => (
                <div
                  key={post.slug}
                  className="flex flex-col flex-none md:w-[14rem] w-[14rem] duration-300"
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
                          <span className="text-gray-400 text-sm">
                            No image
                          </span>
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
      </div>
    </div>
  );
};

export default BlogsBox;
