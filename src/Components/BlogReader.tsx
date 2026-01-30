import { useState, useEffect } from "react";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { BlogPost, loadMarkdownFile } from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "./CustomMarkdownReader";

const BlogReader = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postSlug = slug || "my-first-post";
        const loadedPost = await loadMarkdownFile(postSlug);

        if (!loadedPost) {
          throw new Error("Failed to load blog post");
        }
        setPost(loadedPost);

        // Track blog post views
        logEvent(analytics, "blog_page_view", {
          page_title: loadedPost.frontmatter.title,
          page_location: window.location.href,
          content_type: "blog_post",
          content_id: postSlug,
        });
      } catch (err) {
        setError("Failed to load blog post");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleBackClick = () => {
    navigate("/?section=blog");
  };

  if (loading)
    return (
      <div
        className={`flex justify-center items-center h-screen bg-secondarybg`}
      >
        <p className={`text-lg font-serif  text-primary`}>Loading...</p>
      </div>
    );

  if (error)
    return (
      <div
        className={`flex justify-center items-center h-screen bg-secondarybg`}
      >
        <p className="text-red-500 font-serif">{error}</p>
      </div>
    );

  if (!post)
    return (
      <div
        className={`flex justify-center items-center h-screen bg-secondarybg`}
      >
        <p className={`font-serif  text-primary`}>Post not found</p>
      </div>
    );

  return (
    <div className={`min-h-screen bg-secondarybg py-12 px-4 md:px-0`}>
      {/* Breadcrumb navigation */}
      <div className="max-w-3xl mx-auto mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => navigate("/")}
            className="hover:underline transition-all flex-shrink-0"
          >
            Home
          </button>
          <span className="flex-shrink-0">›</span>
          <button
            onClick={handleBackClick}
            className="hover:underline transition-all flex-shrink-0"
          >
            Blogs
          </button>
          <span className="flex-shrink-0">›</span>
          <span className="text-gray-500 truncate min-w-0">
            {post?.frontmatter.title}
          </span>
        </nav>
      </div>

      {/* Refined content container */}
      <article className="max-w-3xl mx-auto">
        {/* Optional banner image */}
        {post?.frontmatter.banner && (
          <div className="mb-10 overflow-hidden">
            <img
              src={post.frontmatter.banner}
              alt={post.frontmatter.title}
              className="w-full h-auto object-cover max-h-[500px]"
            />
          </div>
        )}

        {/* Elegant header section */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-sans font-light leading-tight mb-3">
            {post?.frontmatter.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-widest text-gray-500 font-light">
            <time>{post?.frontmatter.date}</time>
            {post?.frontmatter.tags && (
              <>
                <span>•</span>
                <span>{post?.frontmatter.tags}</span>
              </>
            )}
          </div>
        </header>

        {/* Content section with refined styling */}
        <div className="prose prose-lg max-w-none font-serif mx-auto">
          <CustomMarkdownReader content={post?.content || ""} />
        </div>
      </article>
    </div>
  );
};

export default BlogReader;
