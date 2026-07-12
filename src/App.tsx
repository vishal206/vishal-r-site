import { useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import HomeHero from "./components/HomeHero";
import SectionDock from "./components/SectionDock";
import MoviesSection from "./Pages/sections/MoviesSection";
import BooksSection from "./Pages/sections/BooksSection";
import ProjectsSection from "./Pages/sections/ProjectsSection";
import BlogSection from "./Pages/sections/BlogSection";
import {
  BlogPostMeta,
  ProjectMeta,
  getBooksSync,
  getAllProjectsMeta,
} from "./Utils/markdownLoader";
import { fetchBlogPosts } from "./Utils/functions";
import {
  SectionId,
  SECTION_TO_PATH,
  PATH_TO_SECTION,
} from "./Utils/sections";

const SECTION_CONTENT: Record<SectionId, ReactNode> = {
  movies: <MoviesSection />,
  books: <BooksSection />,
  projects: <ProjectsSection />,
  blog: <BlogSection />,
};

const App = () => {
  const navigate = useNavigate();
  const books = useMemo(() => getBooksSync(), []);
  const [blogs, setBlogs] = useState<BlogPostMeta[]>([]);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  useEffect(() => {
    fetchBlogPosts(
      () => {},
      () => {},
      (posts) => setBlogs(posts),
    );
    getAllProjectsMeta().then(setProjects);
  }, []);

  const movies = useMemo(
    () => blogs.filter((b) => b.tags === "Movie").slice(0, 3),
    [blogs],
  );
  const writing = useMemo(
    () => blogs.filter((b) => b.tags !== "Movie").slice(0, 10),
    [blogs],
  );

  // The dock is always visible at the bottom; clicking a sticker raises that
  // section's content up from behind the dock as a sheet over the home hero.
  // Clicking the already-open section (or Escape) drops the sheet back down.
  const [active, setActive] = useState<SectionId | null>(
    PATH_TO_SECTION[window.location.pathname] ?? null,
  );

  // Body never scrolls — the sheet manages its own internal scroll.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const select = useCallback((id: SectionId) => {
    setActive((current) => {
      const next = current === id ? null : id;
      window.history.replaceState(null, "", next ? SECTION_TO_PATH[next] : "/");
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setActive(null);
    window.history.replaceState(null, "", "/");
  }, []);

  // Escape drops the sheet.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-editorial-bg text-editorial-text font-primary"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.3px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* ── Home backdrop (always behind) ── */}
      <HomeHero />

      {/* ── Section sheet: rises from the bottom when a section is open ── */}
      <div
        className="absolute inset-0 z-20 bg-editorial-bg overflow-y-auto transition-transform duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: active ? "translateY(0%)" : "translateY(100%)",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.3px)",
          backgroundSize: "24px 24px",
          // Clear the dock (tall sticker row on desktop, tab bar on mobile).
          paddingBottom: "13rem",
          pointerEvents: active ? "auto" : "none",
        }}
      >
        {active && (
          <div key={active} className="animate-sheet-rise min-h-full pt-10 md:pt-14">
            {SECTION_CONTENT[active]}
          </div>
        )}
      </div>

      {/* ── Scrim so sheet content doesn't peek through the sticker gaps.
          Only ~3/4 the height of the shrunk stickers, and only while a
          section is open. ── */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 pointer-events-none transition-all duration-500 ${
          active ? "h-[68px]" : "h-0"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(to top, var(--color-editorial-bg, #111111) 30%, transparent)",
        }}
      />

      {/* ── Persistent dock ── */}
      <SectionDock
        navigate={navigate}
        books={books}
        movies={movies}
        writing={writing}
        projects={projects}
        active={active}
        onSelect={select}
        onHome={close}
      />
    </div>
  );
};

export default App;
