import { useState, useEffect, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import ScrollToTopButton from "./ScrollToTopButton";
import { setExclusionRect } from "../Utils/exclusionZone";

// Small square badge used for a reader's brand mark (image, emoji, or text).
export const LogoBox = ({
  logo,
  title,
  size = "md",
}: {
  logo: string;
  title: string;
  size?: "sm" | "md" | "lg";
}) => {
  const isImage = logo && (logo.startsWith("/") || logo.startsWith("http"));
  const sizeClasses = {
    sm: "w-9 h-9 rounded-xl text-lg",
    md: "w-12 h-12 rounded-xl text-2xl",
    lg: "w-16 h-16 rounded-2xl text-3xl",
  }[size];
  return (
    <div
      className={`${sizeClasses} bg-[#1e1e1e] border border-editorial-divider flex items-center justify-center overflow-hidden shrink-0`}
    >
      {isImage ? (
        <img src={logo} alt={title} className="w-full h-full object-cover" />
      ) : (
        <span className="select-none">{logo || "📦"}</span>
      )}
    </div>
  );
};

interface ReaderShellProps {
  /** Brand mark shown in the sidebar / mobile header (image url, emoji, or text). */
  brandLogo: string;
  /** Brand title shown next to the mark. */
  brandTitle: string;
  /** Render the brand mark as a bare image (no background bubble) — for stickers. */
  brandBare?: boolean;
  /** Heading for the nav region + label for the mobile nav button. */
  navLabel: string;
  /** Route the back button navigates to (e.g. "/archive"). */
  backTo: string;
  /** Label for the back button (e.g. "Archive"). */
  backLabel: string;
  /** Optional item rendered above the nav heading (e.g. an "Overview" link). */
  preNav?: ReactNode;
  /** The nav list. Rendered in both the desktop sidebar and the mobile overlay. */
  nav?: ReactNode;
  /** Optional third column (e.g. an on-this-page table of contents). */
  rightRail?: ReactNode;
  /** Content pane. Should include its own compact header. */
  children: ReactNode;
}

/**
 * App-shell layout shared by the project, blog, and book readers: a fixed
 * left sidebar with independent scrolling, a mobile header + fullscreen
 * navigation overlay, and a content pane that scrolls in its own pane.
 */
const ReaderShell = ({
  brandLogo,
  brandTitle,
  brandBare,
  navLabel,
  backTo,
  backLabel,
  preNav,
  nav,
  rightRail,
  children,
}: ReaderShellProps) => {
  const navigate = useNavigate();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const hasNav = Boolean(preNav || nav);

  // Keep the background exclusion zone in sync with the content pane.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const update = () => setExclusionRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => () => setExclusionRect(null), []);

  const brandMark = brandBare ? (
    <img
      src={brandLogo}
      alt={brandTitle}
      className="w-10 h-10 object-contain shrink-0 select-none"
    />
  ) : (
    <LogoBox logo={brandLogo} title={brandTitle} size="sm" />
  );

  const navRegion = (
    <>
      {preNav}
      {nav && (
        <div className="px-6 pt-5 pb-8">
          <div className="text-[9px] uppercase tracking-[0.2em] text-editorial-label mb-3">
            {navLabel}
          </div>
          <div className="h-px bg-editorial-divider mb-1" />
          {nav}
        </div>
      )}
    </>
  );

  return (
    <div className="h-screen bg-editorial-bg text-editorial-text font-primary flex flex-col">
      {/* ── Mobile header ── */}
      <header className="md:hidden px-6 py-4 flex items-center justify-between border-b border-editorial-divider shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(backTo)}
            className="text-editorial-label hover:text-editorial-text transition-colors shrink-0"
            aria-label={`Back to ${backLabel}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          {brandMark}
          <span className="text-sm font-display font-bold text-editorial-text truncate">
            {brandTitle}
          </span>
        </div>

        {hasNav && (
          <button
            onClick={() => setOverlayOpen(true)}
            className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors shrink-0 ml-3"
          >
            {navLabel}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </header>

      {/* ── Mobile fullscreen overlay ── */}
      {overlayOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-editorial-bg flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between border-b border-editorial-divider">
            <div className="flex items-center gap-3">
              {brandMark}
              <span className="text-sm font-display font-bold text-editorial-text">
                {brandTitle}
              </span>
            </div>
            <button
              onClick={() => setOverlayOpen(false)}
              className="text-editorial-label hover:text-editorial-text transition-colors"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto py-2"
            onClick={() => setOverlayOpen(false)}
          >
            {navRegion}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar (desktop only) ── */}
        <aside className="hidden md:flex w-60 shrink-0 border-r border-editorial-divider flex-col overflow-y-auto">
          <div className="p-6 border-b border-editorial-divider">
            <button
              onClick={() => navigate(backTo)}
              className="text-[9px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors block mb-5 text-left"
            >
              ← {backLabel}
            </button>
            <div className="flex items-center gap-3">
              {brandMark}
              <h2 className="text-sm font-display font-bold text-editorial-text leading-tight">
                {brandTitle}
              </h2>
            </div>
          </div>
          {navRegion}
        </aside>

        {/* ── Content pane ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="px-6 md:px-12 pt-10 pb-20">{children}</div>
        </main>

        {/* ── Right rail (desktop, optional) ── */}
        {rightRail && (
          <aside className="hidden xl:block w-56 shrink-0 border-l border-editorial-divider overflow-y-auto px-6 py-10">
            {rightRail}
          </aside>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default ReaderShell;
