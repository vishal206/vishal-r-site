import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

type ActivePage = "blog" | "about";

interface SiteHeaderProps {
  activePage?: ActivePage;
}

const SiteHeader = ({ activePage }: SiteHeaderProps) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-editorial-bg border-b border-editorial-divider flex items-center justify-between px-6 md:px-12 transition-all duration-300 ${
        scrolled ? "py-3" : "py-6"
      }`}
    >
      <Link
        to="/"
        className={`font-display font-black text-editorial-text hover:opacity-80 transition-all duration-300 leading-none ${
          scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"
        }`}
      >
        Vishal R
      </Link>

      <nav className="flex gap-5 md:gap-12 text-[10px] md:text-[11px] uppercase tracking-[0.22em]">
        <button
          onClick={() => navigate("/archive")}
          className={`transition-colors cursor-pointer ${
            activePage === "blog"
              ? "text-editorial-text border-b border-editorial-text pb-0.5"
              : "text-editorial-label hover:text-editorial-text"
          }`}
        >
          Blog
        </button>
        <button
          onClick={() => navigate("/about")}
          className={`transition-colors cursor-pointer ${
            activePage === "about"
              ? "text-editorial-text border-b border-editorial-text pb-0.5"
              : "text-editorial-label hover:text-editorial-text"
          }`}
        >
          About
        </button>
      </nav>

      <div className="text-[10px] uppercase tracking-[0.18em] text-editorial-label text-right hidden md:block">
        Developer. Writer. Builder.
      </div>
    </header>
  );
};

export default SiteHeader;
