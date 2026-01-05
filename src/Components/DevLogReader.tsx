import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { loadDevLogFile, DevLog } from "../Utils/markdownLoader";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";

const DevLogReader: React.FC = () => {
  const { project, slug } = useParams<{ project: string; slug: string }>();
  const navigate = useNavigate();
  const [devLog, setDevLog] = useState<DevLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevLog = async () => {
      try {
        setLoading(true);
        if (!project || !slug) {
          throw new Error("Project or slug not provided");
        }

        const loadedDevLog = await loadDevLogFile(project, slug);

        if (!loadedDevLog) {
          throw new Error("Failed to load devlog");
        }
        setDevLog(loadedDevLog);

        // Track devlog views
        logEvent(analytics, "devlog_page_view", {
          page_title: loadedDevLog.frontmatter.title,
          page_location: window.location.href,
          content_type: "devlog",
          content_id: `${project}/${slug}`,
          project_name: project,
        });
      } catch (err) {
        setError("Failed to load devlog");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevLog();
  }, [project, slug]);

  const handleBackClick = () => {
    navigate("/?section=devlog");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !devLog) {
    return (
      <div className="min-h-screen bg-background-secondaryflex items-center justify-center">
        <div className="text-red-500">{error || "DevLog not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb navigation */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-text-secondary">
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
              DevLogs
            </button>
            <span className="flex-shrink-0">›</span>
            <span className="text-gray-500 truncate min-w-0">
              {devLog.frontmatter.title}
            </span>
          </nav>
        </div>

        {/* Header section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="capitalize font-medium">{project}</span>
            <span>•</span>
            <span>{devLog.frontmatter.date}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-serif font-light text-text-secondary mb-4">
            {devLog.frontmatter.title}
          </h1>
        </div>

        {/* Content section */}
        <div className="prose prose-lg max-w-none font-serif mx-auto">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-2xl md:text-3xl font-serif font-light mt-10 mb-4"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-xl md:text-2xl font-serif font-light mt-8 mb-3"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-lg md:text-xl font-serif font-light mt-6 mb-2"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-6 leading-relaxed font-light" {...props} />
              ),
              a: (props) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 border-b border-gray-300 hover:border-gray-700 transition-colors"
                >
                  {props.children}
                </a>
              ),
            }}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {devLog.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default DevLogReader;
