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
  // A section (the archive, via "More articles") opens as a sheet over the
  // home screen. The header's home link, or Escape, closes it.
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

  // Escape closes the sheet.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-editorial-bg text-editorial-text font-primary"
    >
      {/* ── Home backdrop (always behind) ── */}
      <HomeHero onHome={close} onMoreArticles={() => select("blog")} />

      {/* ── Section sheet: covers the home screen while a section is open.
          The site header scrolls away with its content, as on every screen;
          its home link closes the sheet. ── */}
      {active && (
        <div
          key={active}
          className="absolute inset-0 z-20 bg-editorial-bg overflow-y-auto pb-16"
        >
          <SiteHeader onHome={close} />
          <div className="pt-6 md:pt-8">{SECTION_CONTENT[active]}</div>
        </div>
      )}
    </div>
  );
};

export default App;
