import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import SiteHeader from "./components/SiteHeader";
import MovieDisk from "./components/MovieDisk";
import ProjectBar from "./components/ProjectBar";
import {
  BlogPostMeta,
  Book as BookType,
  loadMarkdownFile,
  getBooksSync,
} from "./Utils/markdownLoader";
import Book3D from "./components/Book3D";

const stripMarkdown = (md: string): string =>
  md
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/^>\s*/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/^-{3,}$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
import { fetchBlogPosts } from "./Utils/functions";
import {
  usePostImpressions,
  PostCounts as PostCountsType,
} from "./hooks/usePostImpressions";

type FeedItem = {
  slug: string;
  title: string;
  date: string;
  label: string;
  image?: string;
  to: string;
  isBook: boolean;
  isMovie: boolean;
  blog?: BlogPostMeta; // present for blog entries (needed by MovieDisk)
  book?: BookType; // present for book entries (needed by Book3D)
  review?: string; // present for book entries (featured preview text)
};

const PostCounts = ({ counts }: { counts: PostCountsType }) => (
  <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-editorial-label">
    <span className="flex items-center gap-1.5">
      <svg
        width="11"
        height="11"
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
      {counts.viewCount.toLocaleString()}
    </span>
    <span className="flex items-center gap-1.5">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      {counts.likeCount.toLocaleString()}
    </span>
    <span className="flex items-center gap-1.5">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {counts.commentCount.toLocaleString()}
    </span>
  </div>
);

const App = () => {
  const [blogs, setBlogs] = useState<BlogPostMeta[]>([]);
  const [featuredContent, setFeaturedContent] = useState<string>("");
  const books = useMemo(() => getBooksSync(), []);
  const navigate = useNavigate();

  // Blogs and books share the main feed, sorted by date — the latest becomes the
  // featured entry, the rest fill the secondary "01 / Blogs" column.
  const feed = useMemo<FeedItem[]>(() => {
    const blogItems: FeedItem[] = blogs.map((b) => ({
      slug: b.slug,
      title: b.title,
      date: b.date,
      label: b.tags || "Essay",
      image: b.image,
      to: `/archive/${b.slug}`,
      isBook: false,
      isMovie: b.tags === "Movie",
      blog: b,
    }));
    const bookItems: FeedItem[] = books.map((bk) => ({
      slug: bk.slug,
      title: bk.title,
      date: bk.date || "",
      label: bk.genres[0] || "Book",
      image: bk.cover,
      to: `/book/${bk.slug}`,
      isBook: true,
      isMovie: false,
      book: bk,
      review: bk.review,
    }));
    return [...blogItems, ...bookItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [blogs, books]);

  const featured = feed[0] ?? null;
  const impressions = usePostImpressions(feed.slice(0, 4).map((p) => p.slug));

  useEffect(() => {
    if (!featured) return;
    if (featured.isBook) {
      setFeaturedContent(stripMarkdown(featured.review || ""));
      return;
    }
    loadMarkdownFile(featured.slug).then((post) => {
      if (post) setFeaturedContent(stripMarkdown(post.content));
    });
  }, [featured?.slug]);

  useEffect(() => {
    fetchBlogPosts(
      () => {},
      () => {},
      (posts) => {
        setBlogs(posts);
      },
    );
  }, []);

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
      <SiteHeader />
      <div className="px-6 md:px-12 pb-6 max-w-screen-xl mx-auto">
        {/* ── Featured + Blogs side by side (desktop) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Left — Featured */}
          {featured && (
            <div className="md:col-span-2 md:border-r border-editorial-divider py-8 md:py-0 md:relative md:overflow-hidden">
              {/* On desktop this layer is absolute so the cell contributes no
                  intrinsic height — the right column drives the row height and
                  this fills it exactly, clipping any overflowing body text.
                  The whole layer is one Link so the entire area is clickable. */}
              <Link
                to={featured.to}
                className="group md:absolute md:inset-0 md:pr-12 md:py-14 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-available whitespace-nowrap">
                    Featured {featured.label}
                  </span>
                </div>

                <div className="relative md:flex md:flex-row md:items-stretch md:gap-8 flex-1 min-h-0">
                  {/* Image / Disk — top-right corner on mobile, inline on desktop */}
                  {featured.isMovie && featured.blog ? (
                    <div className="absolute top-0 right-0 md:relative md:order-2 md:flex md:justify-end shrink-0">
                      <MovieDisk
                        post={featured.blog}
                        tilt={-4}
                        diskClassName="w-28 h-28 md:w-72 md:h-72 lg:w-80 lg:h-80"
                      />
                    </div>
                  ) : featured.isBook && featured.book ? (
                    <div className="float-right ml-5 mb-3 md:float-none md:ml-0 md:mb-0 md:relative md:order-2 shrink-0 flex md:items-center md:h-full">
                      <Book3D book={featured.book} height={{ base: 140, md: 340 }} />
                    </div>
                  ) : featured.image ? (
                    <div className="float-right ml-5 mb-3 md:float-none md:ml-0 md:mb-0 md:relative md:order-2 shrink-0 w-24 md:w-auto">
                      <div className="aspect-square w-full md:w-auto md:h-full md:aspect-[9/16] overflow-hidden rounded-xl">
                        <img
                          src={featured.image}
                          alt={featured.title}
                          className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Text content */}
                  <div className="flex-1 min-w-0 md:order-1 md:flex md:flex-col md:min-h-0">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-editorial-text leading-[1.05] mb-5 group-hover:opacity-75 transition-opacity">
                      {featured.title}
                    </h2>

                    {/* Body preview — fills remaining space and fades out.
                      Mobile uses overflow-clip (not hidden) so it does NOT
                      create a BFC and the text wraps around the floated image. */}
                    <div className="relative max-h-56 overflow-clip md:max-h-none md:overflow-hidden md:flex-1 md:min-h-0">
                      <p className="text-sm md:text-base text-editorial-label font-body leading-relaxed whitespace-pre-line">
                        {featuredContent}
                      </p>
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-editorial-bg to-transparent pointer-events-none" />
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between pt-4 clear-both md:clear-none">
                      {impressions[featured.slug] != null ? (
                        <PostCounts counts={impressions[featured.slug]} />
                      ) : (
                        <span />
                      )}
                      <span className="text-[10px] uppercase tracking-[0.2em] text-available group-hover:opacity-70 transition-opacity">
                        {featured.isBook ? "Read review →" : "Read full →"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Right — 01 / Blogs (3 posts) */}
          <div
            className={`md:col-span-1 py-8 md:py-14 border-t border-editorial-divider md:border-t-0 md:pl-12${!featured ? " md:col-start-3" : ""}`}
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-5">
              01 / Blogs
            </div>
            <div className="h-px bg-editorial-divider" />

            <div>
              {feed.slice(1, 4).map((item) => (
                <div key={item.slug} className="py-5">
                  <Link to={item.to} className="group block">
                    <div className="mb-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-available">
                        {item.label}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-display font-bold text-editorial-text leading-snug group-hover:opacity-70 transition-opacity">
                      {item.title}
                    </h3>
                  </Link>
                  {impressions[item.slug] != null && (
                    <div className="mt-2">
                      <PostCounts counts={impressions[item.slug]} />
                    </div>
                  )}
                  <div className="h-px bg-editorial-divider mt-5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Projects Bar ── */}
        <ProjectBar />

        {/* ── 03 / Movie  |  04 / Book ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-0 border-t border-editorial-divider">
          {/* Left — 03 / Movie */}
          <div className="md:border-r border-editorial-divider md:pr-12 py-8">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label">
                03 / Movie
              </div>
              <Link
                to="/movies"
                className="text-[10px] uppercase tracking-[0.2em] text-available hover:opacity-70 transition-opacity"
              >
                All movies →
              </Link>
            </div>
            <div className="h-px bg-editorial-divider" />

            <div className="flex flex-row items-end justify-center gap-8 md:gap-12 pt-10 pb-4">
              {blogs
                .filter((p) => p.tags === "Movie")
                .slice(0, 2)
                .map((post, i) => (
                  <MovieDisk
                    key={post.slug}
                    post={post}
                    tilt={i === 0 ? -6 : 5}
                  />
                ))}
            </div>
          </div>

          {/* Right — 04 / Book */}
          <div className="border-t border-editorial-divider md:border-t-0 md:pl-12 py-8">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label">
                04 / Book
              </div>
              <Link
                to="/books"
                className="text-[10px] uppercase tracking-[0.2em] text-available hover:opacity-70 transition-opacity"
              >
                All books →
              </Link>
            </div>
            <div className="h-px bg-editorial-divider" />

            <div className="flex flex-wrap gap-x-8 gap-y-8 pt-10 items-start">
              {books.slice(0, 3).map((book) => (
                <Link key={book.slug} to={`/book/${book.slug}`}>
                  <Book3D book={book} height={190} tiltDeg={20} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="border-t border-editorial-divider py-6 mt-4">
          <div className="flex flex-wrap justify-between items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-editorial-label">
            {/* Left — social icons */}
            <div className="flex items-center gap-5">
              <a
                href="https://x.com/vishal_r_dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-editorial-label hover:text-editorial-text transition-colors"
                aria-label="Twitter / X"
              >
                {/* X (Twitter) logo */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/vishal206"
                target="_blank"
                rel="noopener noreferrer"
                className="text-editorial-label hover:text-editorial-text transition-colors"
                aria-label="GitHub"
              >
                {/* GitHub logo */}
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>

            {/* Right — site links */}
            <div className="flex gap-6">
              <a
                href="/rss.xml"
                className="hover:text-editorial-text transition-colors"
              >
                RSS Feed
              </a>
              <button
                onClick={() => navigate("/about")}
                className="hover:text-editorial-text transition-colors cursor-pointer"
              >
                About
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
