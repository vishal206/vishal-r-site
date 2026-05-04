import { useState } from "react";
import type { PostEngagementData } from "../hooks/usePostEngagement";

interface Props extends PostEngagementData {
  variant: "compact" | "full";
  commentCount: number;
}

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const CommentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

// Count that expands to the right when it appears
const ExpandCount = ({
  count,
  className,
}: {
  count: number;
  className?: string;
}) => (
  <span
    style={{
      maxWidth: count > 0 ? "2rem" : "0",
      opacity: count > 0 ? 1 : 0,
      marginLeft: count > 0 ? "0.375rem" : "0",
      overflow: "hidden",
      transition:
        "max-width 0.3s ease, opacity 0.3s ease, margin-left 0.3s ease",
      display: "inline-block",
      whiteSpace: "nowrap",
    }}
    className={`text-[11px] tracking-[0.18em] ${className ?? ""}`}
  >
    {count.toLocaleString()}
  </span>
);

export const PostEngagement = ({
  viewCount,
  likeCount,
  liked,
  toggleLike,
  commentCount,
  variant,
}: Props) => {
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
        <div className="flex items-center text-editorial-label">
          <EyeIcon />
          <ExpandCount count={viewCount} />
        </div>

        <button
          onClick={toggleLike}
          className={`flex items-center cursor-pointer transition-colors ${liked ? "text-red-400" : "text-editorial-label hover:text-red-400"}`}
        >
          <HeartIcon filled={liked} />
          <ExpandCount
            count={likeCount}
            className={liked ? "text-red-400" : ""}
          />
        </button>

        <div className="flex items-center text-editorial-label">
          <CommentIcon />
          <ExpandCount count={commentCount} />
        </div>

        <button
          onClick={handleShare}
          className="text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
          title={copied ? "Copied!" : "Share"}
        >
          <ShareIcon />
        </button>
      </div>
    );
  }

  const boxClass =
    "flex items-center justify-center py-3 w-16 border-t border-b transition-colors";

  return (
    <div className="mt-12 pt-8 border-t border-editorial-divider">
      <div className="flex">
        <div
          className={`${boxClass} border-l border-r border-editorial-divider text-editorial-label`}
        >
          <EyeIcon />
          <ExpandCount count={viewCount} />
        </div>

        <button
          onClick={toggleLike}
          className={`${boxClass} border-r border-editorial-divider cursor-pointer ${liked ? "text-red-400" : "text-editorial-label hover:text-red-400"}`}
        >
          <HeartIcon filled={liked} />
          <ExpandCount
            count={likeCount}
            className={liked ? "text-red-400" : ""}
          />
        </button>

        <div
          className={`${boxClass} border-r border-editorial-divider text-editorial-label`}
        >
          <CommentIcon />
          <ExpandCount count={commentCount} />
        </div>

        <button
          onClick={handleShare}
          title={copied ? "Copied!" : "Share"}
          className={`${boxClass} border-r border-editorial-divider text-editorial-label hover:text-editorial-text cursor-pointer`}
        >
          <ShareIcon />
        </button>
      </div>
    </div>
  );
};
