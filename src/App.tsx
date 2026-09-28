import { useState, useEffect, useCallback, ReactNode } from "react";
import HomeHero from "./components/HomeHero";
import SiteHeader from "./components/SiteHeader";
import BlogSection from "./Pages/sections/BlogSection";
import {
  SectionId,
  SECTION_TO_PATH,
  PATH_TO_SECTION,
} from "./Utils/sections";

const SECTION_CONTENT: Record<SectionId, ReactNode> = {
  blog: <BlogSection />,
};

const App = () => {
  // A section (the archive, via "More articles") rises as a sheet over the
  // home screen. The header's home link, or Escape, drops it back down.
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
      className="fixed inset-0 flex flex-col overflow-hidden bg-editorial-bg text-editorial-text font-primary"
    >
      {/* ── Site header: fixed along the top, above the home screen and any
          open section, which scroll beneath it. Home drops the sheet. ── */}
      <SiteHeader onHome={close} />

      {/* ── Everything below the header ── */}
      <div className="relative flex-1 min-h-0">
        {/* ── Home backdrop (always behind) ── */}
        <HomeHero onMoreArticles={() => select("blog")} />

        {/* ── Section sheet: rises from the bottom when a section is open ── */}
        <div
          className="absolute inset-0 z-20 bg-editorial-bg overflow-y-auto transition-transform duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: active ? "translateY(0%)" : "translateY(100%)",
            pointerEvents: active ? "auto" : "none",
          }}
        >
          {active && (
            <div key={active} className="animate-sheet-rise min-h-full pt-6 md:pt-8 pb-16">
              {SECTION_CONTENT[active]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
