import { useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import HomeHero from "./components/HomeHero";
import SectionDock from "./components/SectionDock";
import ProjectsSection from "./Pages/sections/ProjectsSection";
import BlogSection from "./Pages/sections/BlogSection";
import {
  BlogPostMeta,
  ProjectMeta,
  getAllProjectsMeta,
} from "./Utils/markdownLoader";
import { fetchBlogPosts } from "./Utils/functions";
import {
  SectionId,
  SECTION_TO_PATH,
  PATH_TO_SECTION,
} from "./Utils/sections";

const SECTION_CONTENT: Record<SectionId, ReactNode> = {
  projects: <ProjectsSection />,
  blog: <BlogSection />,
};

const App = () => {
  const navigate = useNavigate();
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

  const writing = useMemo(() => blogs.slice(0, 10), [blogs]);

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
          Only while a section is open.

          Kept as shallow as the job allows: a section's own content runs right
          down to the dock, and every pixel this reaches up is a pixel of that
          content greyed out. So the solid part is only the strip actually below the
          stickers, and the rest is a quick fade rather than a long wash. ── */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 pointer-events-none transition-all duration-500 ${
          active ? "h-[40px]" : "h-0"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(to top, var(--color-editorial-bg, #111111) 0%, rgba(17,17,17,0.55) 45%, transparent 100%)",
        }}
      />

      {/* ── Persistent dock ── */}
      <SectionDock
        navigate={navigate}
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
