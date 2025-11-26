import { useState, useEffect } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogPost, loadMarkdownFile } from '../Utils/markdownLoader';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
        const postSlug = slug || 'my-first-post';
        const loadedPost = await loadMarkdownFile(postSlug);
        
        if (!loadedPost) {
          throw new Error('Failed to load blog post');
        }
        setPost(loadedPost);
        
        // Track blog post views
        logEvent(analytics, 'blog_page_view', {
          page_title: loadedPost.frontmatter.title,
          page_location: window.location.href,
          content_type: 'blog_post',
          content_id: postSlug
        });
      } catch (err) {
        setError('Failed to load blog post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleBackClick = () => {
    navigate('/?section=blog');
  };

  if (loading) return (
    <div className={`flex justify-center items-center h-screen bg-mainbg`}>
      <p className={`text-lg font-serif text-text-primary`}>Loading...</p>
    </div>
  );
  
  if (error) return (
    <div className={`flex justify-center items-center h-screen bg-mainbg`}>
      <p className="text-red-500 font-serif">{error}</p>
    </div>
  );
  
  if (!post) return (
    <div className={`flex justify-center items-center h-screen bg-mainbg`}>
      <p className={`font-serif text-text-primary`}>Post not found</p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-background-secondary py-12 px-4 md:px-0`}>
      
      {/* Breadcrumb navigation */}
      <div className="max-w-3xl mx-auto mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <button 
            onClick={() => navigate('/')}
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
          <span className="text-gray-500 truncate min-w-0">{post?.frontmatter.title}</span>
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
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-serif font-light mt-10 mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-serif font-light mt-8 mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg md:text-xl font-serif font-light mt-6 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="mb-6 leading-relaxed font-light" {...props} />,
              a: (props) => (
                <a {...props} target="_blank" rel="noopener noreferrer" className="text-gray-700 border-b border-gray-300 hover:border-gray-700 transition-colors">
                  {props.children}
                </a>
              ),
              img: ({node, ...props}) => (
                <img className="max-w-full h-auto my-8 mx-auto" {...props} />
              ),
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-2 border-gray-300 pl-4 italic text-gray-700 my-6" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="font-bold" {...props} />
              ),
              em: ({node, ...props}) => (
                <em className="italic" {...props} />
              ),
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6" {...props} />,
              li: ({node, ...props}) => <li className="mb-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6" {...props} />,
            }}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {post?.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
};

export default BlogReader;
