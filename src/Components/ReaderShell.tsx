import { useEffect, useRef, ReactNode } from "react";
import ScrollToTopButton from "./ScrollToTopButton";
import SiteHeader from "./SiteHeader";
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
  /** Optional right-hand column (e.g. an on-this-page table of contents). */
  rightRail?: ReactNode;
  /** Content pane. Should include its own compact header. */
  children: ReactNode;
}

/**
 * Layout for the article reader: the site header, then the article —
 * which scrolls on its own — in the header's column, with an optional right
 * rail beside it on wide screens.
 */
const ReaderShell = ({ rightRail, children }: ReaderShellProps) => {
  const mainRef = useRef<HTMLElement>(null);

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

  return (
    <div className="h-screen bg-editorial-bg text-editorial-text font-primary flex flex-col">
      {/* ── Site header, as on every screen ── */}
      <SiteHeader />

      {/* ── Body: scrolls on its own below the header. Its content sits in
          the header's centred column, so the article lines up with it. ── */}
      <main ref={mainRef} className="flex-1 overflow-y-auto">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 flex gap-12">
          {/* ── Article: a readable measure, from the column's left edge ── */}
          <div className="min-w-0 flex-1 max-w-4xl pt-6 md:pt-8 pb-20">
            {children}
          </div>

          {/* ── Right rail (desktop, optional): stays in view as you read, never
              taller than the space under the header (114px tall at this
              width). What's inside decides what scrolls; the rail itself only
              scrolls on a screen too short to fit it. ── */}
          {rightRail && (
            <aside className="hidden xl:flex flex-col w-56 shrink-0 ml-auto sticky top-0 self-start max-h-[calc(100vh-114px)] overflow-y-auto pt-6 md:pt-8 pb-8">
              {rightRail}
            </aside>
          )}
        </div>
      </main>

      <ScrollToTopButton />
    </div>
  );
};

export default ReaderShell;
