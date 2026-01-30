import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadDevLogFile, DevLog } from "../Utils/markdownLoader";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";
import { CustomMarkdownReader } from "./CustomMarkdownReader";

const DevLogReader: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [devLog, setDevLog] = useState<DevLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevLog = async () => {
      try {
        setLoading(true);
        if (!slug) {
          throw new Error("Project or slug not provided");
        }

        const loadedDevLog = await loadDevLogFile(slug);

        if (!loadedDevLog) {
          throw new Error("Failed to load devlog");
        }
        setDevLog(loadedDevLog);

        // Track devlog views
        logEvent(analytics, "devlog_page_view", {
          page_title: loadedDevLog.frontmatter.title,
          page_location: window.location.href,
          content_type: "devlog",
          content_id: `${slug}`,
        });
      } catch (err) {
        setError("Failed to load devlog");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevLog();
  }, [slug]);

  const handleBackClick = () => {
    navigate("/?section=devlog");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondarybg flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !devLog) {
    return (
      <div className="min-h-screen bg-secondarybgflex items-center justify-center">
        <div className="text-red-500">{error || "DevLog not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondarybg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb navigation */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-secondary">
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
            <span>{devLog.frontmatter.date}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-serif font-light text-secondary mb-4">
            {devLog.frontmatter.title}
          </h1>
        </div>

        {/* Content section */}
        <div className="prose prose-lg max-w-none font-serif mx-auto">
          <CustomMarkdownReader content={devLog.content} />
        </div>
      </div>
    </div>
  );
};

export default DevLogReader;
