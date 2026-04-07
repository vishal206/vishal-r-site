import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BlogPostMeta,
  WeekNoteMeta,
  getAvailableWeekNotes,
  loadWeekNoteFile,
} from "./Utils/markdownLoader";
import { fetchBlogPosts } from "./Utils/functions";

const formatDateLabel = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.toUpperCase();
    return d
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return dateStr.toUpperCase();
  }
};

const formatDateShort = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.toUpperCase();
    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return dateStr.toUpperCase();
  }
};

const App = () => {
  const [blogs, setBlogs] = useState<BlogPostMeta[]>([]);
  const [weekNotes, setWeekNotes] = useState<WeekNoteMeta[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPostMeta | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogPosts(
      () => {},
      () => {},
      (posts) => {
        setBlogs(posts);
        if (posts.length > 0) setFeaturedPost(posts[0]);
      }
    );

    const fetchWeekNotes = async () => {
      try {
        const slugs = getAvailableWeekNotes();
        const promises = slugs.map(async (slug) => {
          const wn = await loadWeekNoteFile(slug);
          if (!wn) return null;
          return {
            slug,
            title: wn.frontmatter.title,
            date: wn.frontmatter.date,
            weeknoteCount: wn.frontmatter.weeknoteCount,
          } as WeekNoteMeta;
        });
        const fetched = (await Promise.all(promises)).filter(
          Boolean
        ) as WeekNoteMeta[];
        setWeekNotes(
          fetched.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchWeekNotes();
  }, []);

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
      <div className="px-6 md:px-12 py-6 max-w-screen-xl mx-auto">

        {/* ── Header ── */}
        <header className="flex items-center justify-between pb-6 border-b border-editorial-divider">
          <Link
            to="/"
            className="text-3xl md:text-5xl font-display font-black text-editorial-text hover:opacity-80 transition-opacity leading-none"
          >
            Vishal R
          </Link>

          <nav className="flex gap-5 md:gap-12 text-[10px] md:text-[11px] uppercase tracking-[0.22em]">
            <button
              onClick={() => navigate("/archive")}
              className="text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
            >
              Blog
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          <div className="text-[10px] uppercase tracking-[0.18em] text-editorial-label text-right hidden md:block">
            Developer. Writer. Builder.
          </div>
        </header>

        {/* ── Featured ── */}
        {featuredPost && (
          <section className="py-8 md:py-14">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <span className="text-[10px] uppercase tracking-[0.22em] text-available whitespace-nowrap">
                Featured {featuredPost.tags || "Essay"}
              </span>
              <div className="w-12 h-px bg-editorial-divider shrink-0" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-editorial-label whitespace-nowrap hidden sm:block">
                {formatDateLabel(featuredPost.date)}
              </span>
            </div>

            <Link to={`/blog/${featuredPost.slug}`} className="group block">
              <h2 className="text-4xl md:text-7xl lg:text-8xl font-display font-black text-editorial-text leading-[0.92] mb-6 group-hover:opacity-75 transition-opacity">
                {featuredPost.title}
              </h2>
            </Link>

            <div className="h-px bg-editorial-divider mt-10" />
          </section>
        )}

        {/* ── Main 2 : 1 Split ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">

          {/* Left — 01 / Blogs */}
          <div className="md:col-span-2 md:border-r border-editorial-divider md:pr-12 py-8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-5">
              01 / Blogs
            </div>
            <div className="h-px bg-editorial-divider" />

            <div className="grid grid-cols-1 md:grid-cols-2">
              {blogs.slice(0, 6).map((post, i) => (
                <div
                  key={post.slug}
                  className={[
                    "py-6",
                    i % 2 === 0 ? "md:pr-8" : "md:pl-8",
                    i >= 4 ? "hidden md:block" : "",
                  ].join(" ")}
                >
                  <Link to={`/blog/${post.slug}`} className="group block">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-available">
                        {post.tags || "Essay"}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-editorial-label">
                        {formatDateShort(post.date)}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-display font-bold text-editorial-text leading-snug group-hover:opacity-70 transition-opacity">
                      {post.title}
                    </h3>
                  </Link>
                  <div className="h-px bg-editorial-divider mt-6" />
                </div>
              ))}
            </div>
          </div>

          {/* Right — 02 / Archive */}
          <div className="md:col-span-1 py-8 border-t border-editorial-divider md:border-t-0 md:pl-12">
            <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-5">
              02 / Archive
            </div>
            <div className="h-px bg-editorial-divider" />

            <div>
              {weekNotes.slice(0, 4).map((wn) => (
                <div key={wn.slug} className="py-5">
                  <Link to={`/weeknote/${wn.slug}`} className="group block">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-editorial-label mb-2">
                      <span>{formatDateLabel(wn.date)}</span>
                      {wn.weeknoteCount && (
                        <>
                          <span>·</span>
                          <span>Week #{wn.weeknoteCount}</span>
                        </>
                      )}
                    </div>
                    <h4 className="text-base font-display font-bold text-editorial-text leading-snug group-hover:opacity-70 transition-opacity">
                      {wn.title}
                    </h4>
                  </Link>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="mt-8">
              <div className="h-px bg-editorial-divider mb-6" />
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.18em]">
                  <span className="text-editorial-label">Twitter / X</span>
                  <a
                    href="https://x.com/vishal_r_dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-editorial-text hover:text-editorial-label transition-colors"
                  >
                    @Vishal_R_Dev
                  </a>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.18em]">
                  <span className="text-editorial-label">Github</span>
                  <a
                    href="https://github.com/vishal206"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-editorial-text hover:text-editorial-label transition-colors"
                  >
                    /Vishal206
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="border-t border-editorial-divider py-6 flex justify-end gap-4 mt-4">
          <div className="flex gap-8 text-[10px] uppercase tracking-[0.18em] text-editorial-label">
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
              Contact
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default App;
