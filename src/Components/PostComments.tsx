import { useState, useRef } from "react";
import type { Comment } from "../hooks/useComments";

interface Props {
  comments: Comment[];
  submitting: boolean;
  onSubmit: (text: string, name: string) => Promise<void>;
}

const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export const PostComments = ({ comments, submitting, onSubmit }: Props) => {
  const [text, setText] = useState("");
  const [name, setName] = useState(() => localStorage.getItem("commentName") || "");
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayName = name.trim() || "Anonymous";

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-expand
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (name.trim()) localStorage.setItem("commentName", name.trim());
    await onSubmit(text, name);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const startEditName = () => {
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  return (
    <div className="mt-12 pt-8 border-t border-editorial-divider">
      <div className="text-[9px] uppercase tracking-[0.22em] text-editorial-label mb-8">
        {comments.length > 0
          ? `${comments.length} ${comments.length === 1 ? "Comment" : "Comments"}`
          : "Comments"}
      </div>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-6 mb-10">
          {comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-[9px] uppercase tracking-[0.14em] text-editorial-label">
                  {c.name}
                </span>
                {c.createdAt && (
                  <span className="text-[9px] text-editorial-label opacity-60">
                    {formatDate(c.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-editorial-text leading-relaxed font-body">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name row */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              placeholder="Anonymous"
              className="bg-transparent border-b border-editorial-text text-[11px] uppercase tracking-[0.14em] text-editorial-text placeholder:text-editorial-label focus:outline-none py-0.5 w-40"
            />
          ) : (
            <button
              type="button"
              onClick={startEditName}
              className="flex items-center gap-1.5 group cursor-pointer"
            >
              <span className="text-[11px] uppercase tracking-[0.14em] text-editorial-text">
                {displayName}
              </span>
              <span className="text-editorial-label group-hover:text-editorial-text transition-colors">
                <PencilIcon />
              </span>
            </button>
          )}
        </div>

        {/* Comment box */}
        <textarea
          ref={textareaRef}
          placeholder="Write a comment…"
          value={text}
          onChange={handleTextChange}
          rows={2}
          className="bg-transparent border border-editorial-divider rounded-none text-sm text-editorial-text placeholder:text-editorial-label focus:outline-none focus:border-editorial-text transition-colors p-3 w-full resize-none overflow-hidden font-body"
        />

        {text.trim() && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="text-[10px] uppercase tracking-[0.22em] px-4 py-2 border border-editorial-divider text-editorial-label hover:border-editorial-text hover:text-editorial-text transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
