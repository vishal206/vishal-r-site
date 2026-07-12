import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { CustomMarkdownReader } from "../components/CustomMarkdownReader";
import Book3D from "../components/Book3D";
import ReaderShell, { LogoBox } from "../components/ReaderShell";
import { PostEngagement } from "../components/PostEngagement";
import { PostComments } from "../components/PostComments";
import { usePostEngagement } from "../hooks/usePostEngagement";
import { useComments } from "../hooks/useComments";
import { loadBookFileSync, getBooksSync } from "../Utils/markdownLoader";

const BRAND_LOGO = "/assets/stickers/book-sticker.png";
const BRAND_TITLE = "Bookshelf";

const BookPage: React.FC = () => {
  const { slug = "" } = useParams();
  const book = useMemo(() => loadBookFileSync(slug), [slug]);

  // Other books on the shelf — a window of up to 2 newer + current + 2 older,
  // newest first (mirrors the blog reader's "In This Archive" rail).
  const shelf = useMemo(() => {
    const all = getBooksSync();
    const idx = all.findIndex((b) => b.slug === slug);
    if (idx === -1) return all.slice(0, 5);
    return all.slice(Math.max(0, idx - 2), idx + 3);
  }, [slug]);

  const engagement = usePostEngagement(slug);
  const { comments, submitting, submitComment } = useComments(slug);

  if (!book) {
    return (
      <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <p className="text-editorial-label mb-6">Book not found.</p>
          <Link
            to="/books"
            className="text-available uppercase tracking-[0.2em] text-xs"
          >
            ← Back to the shelf
          </Link>
        </div>
      </div>
    );
  }

  const nav =
    shelf.length > 0 &&
    shelf.map((b) => {
      const isCurrent = b.slug === slug;
      return (
        <div
          key={b.slug}
          className={`py-4 border-b border-editorial-divider last:border-0 transition-opacity ${isCurrent ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
        >
          {isCurrent ? (
            <>
              <div className="text-[9px] uppercase tracking-[0.18em] text-available mb-1">
                Reading
              </div>
              <p className="text-sm font-display font-bold text-editorial-text leading-tight">
                {b.title}
              </p>
            </>
          ) : (
            <Link to={`/book/${b.slug}`} className="block group">
              <div className="text-[9px] uppercase tracking-[0.18em] text-editorial-label mb-1 line-clamp-1">
                {b.genres[0]}
              </div>
              <p className="text-sm font-display font-bold text-editorial-text leading-tight group-hover:opacity-70 transition-opacity line-clamp-2">
                {b.title}
              </p>
            </Link>
          )}
        </div>
      );
    });

  return (
    <ReaderShell
      brandLogo={BRAND_LOGO}
      brandTitle={BRAND_TITLE}
      brandBare
      navLabel="Bookshelf"
      backTo="/books"
      backLabel="Books"
      nav={nav || undefined}
    >
      {/* ── Compact header ── */}
      <div className="mb-8 pb-8 border-b border-editorial-divider">
        <div className="flex items-center gap-5">
          {book.cover ? (
            <div className="shrink-0">
              <Book3D book={book} height={{ base: 96, md: 120 }} />
            </div>
          ) : (
            <LogoBox logo="📕" title={book.title} size="lg" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] uppercase tracking-[0.22em] text-available">
                Book
              </span>
              {book.author && (
                <span className="text-[10px] uppercase tracking-[0.22em] text-editorial-label truncate">
                  {book.author}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-editorial-text leading-tight">
              {book.title}
            </h1>
            {book.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {book.genres.map((g) => (
                  <span
                    key={g}
                    className="text-[9px] uppercase tracking-[0.16em] text-editorial-muted border border-editorial-divider px-2 py-0.5 rounded-full"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <PostEngagement
          {...engagement}
          commentCount={comments.length}
          variant="compact"
        />
      </div>

      <CustomMarkdownReader content={book.review} />
      <PostEngagement
        {...engagement}
        commentCount={comments.length}
        variant="full"
      />
      <PostComments
        comments={comments}
        submitting={submitting}
        onSubmit={submitComment}
      />
    </ReaderShell>
  );
};

export default BookPage;
