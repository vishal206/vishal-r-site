import { useState } from "react";
import type { PostEngagementData } from "../hooks/usePostEngagement";

interface Props extends PostEngagementData {
  variant: "compact" | "full";
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

export const PostEngagement = ({ viewCount, likeCount, liked, toggleLike, variant }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (viewCount === null) return null;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-5 mt-5">
        <div className="flex items-center gap-2 text-editorial-label">
          <EyeIcon />
          <span className="text-[11px] uppercase tracking-[0.18em]">
            {viewCount.toLocaleString()}
          </span>
        </div>

        <button onClick={toggleLike} className="flex items-center gap-2 group cursor-pointer">
          <span className={`transition-colors ${liked ? "text-red-400" : "text-editorial-label group-hover:text-red-400"}`}>
            <HeartIcon filled={liked} />
          </span>
          {likeCount > 0 && (
            <span className={`text-[11px] uppercase tracking-[0.18em] transition-colors ${liked ? "text-red-400" : "text-editorial-label group-hover:text-red-400"}`}>
              {likeCount.toLocaleString()}
            </span>
          )}
        </button>

        <button onClick={handleShare} className="flex items-center group cursor-pointer text-editorial-label hover:text-editorial-text transition-colors" title={copied ? "Copied!" : "Share"}>
          <ShareIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-editorial-divider">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-editorial-label">
            <EyeIcon />
            <span className="text-[11px] uppercase tracking-[0.18em]">
              {viewCount.toLocaleString()} {viewCount === 1 ? "View" : "Views"}
            </span>
          </div>

          <button onClick={toggleLike} className="flex items-center gap-2 group cursor-pointer">
            <span className={`transition-colors ${liked ? "text-red-400" : "text-editorial-label group-hover:text-red-400"}`}>
              <HeartIcon filled={liked} />
            </span>
            <span className={`text-[11px] uppercase tracking-[0.18em] transition-colors ${liked ? "text-red-400" : "text-editorial-label group-hover:text-red-400"}`}>
              {likeCount > 0 ? `${likeCount.toLocaleString()} ${likeCount === 1 ? "Like" : "Likes"}` : "Like"}
            </span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 group cursor-pointer text-editorial-label hover:text-editorial-text transition-colors"
        >
          <ShareIcon />
          <span className="text-[11px] uppercase tracking-[0.18em]">
            {copied ? "Link Copied!" : "Share"}
          </span>
        </button>
      </div>
    </div>
  );
};
