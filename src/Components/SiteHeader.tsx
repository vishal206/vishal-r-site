import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

type ActivePage = "blog" | "books" | "about";

interface SiteHeaderProps {
  activePage?: ActivePage;
}

const NAV: { label: string; page: ActivePage; to: string }[] = [
  { label: "Blog", page: "blog", to: "/archive" },
  { label: "Books", page: "books", to: "/books" },
  { label: "About", page: "about", to: "/about" },
];

const SiteHeader = ({ activePage }: SiteHeaderProps) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-editorial-bg border-b border-editorial-divider flex justify-between md:grid md:grid-cols-3 items-center gap-4 px-6 md:px-12 transition-all duration-300 ${
        scrolled ? "py-3" : "py-6"
      }`}
    >
      <Link
        to="/"
        onClick={() => setOpen(false)}
        className={`justify-self-start font-display font-black text-editorial-text hover:opacity-80 transition-all duration-300 leading-none ${
          scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"
        }`}
      >
        Vishal R
      </Link>

      {/* Desktop nav — centered */}
      <nav className="justify-self-center hidden md:flex gap-12 text-[11px] uppercase tracking-[0.22em]">
        {NAV.map((item) => (
          <button
            key={item.page}
            onClick={() => navigate(item.to)}
            className={`transition-colors cursor-pointer ${
              activePage === item.page
                ? "text-editorial-text border-b border-editorial-text pb-0.5"
                : "text-editorial-label hover:text-editorial-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="justify-self-end text-[10px] uppercase tracking-[0.18em] text-editorial-label text-right hidden md:block">
        Developer. Writer. Builder.
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="md:hidden relative w-7 h-7 flex flex-col items-center justify-center gap-[5px] cursor-pointer"
      >
        <span
          className="block h-px w-6 bg-editorial-text transition-transform duration-300"
          style={{ transform: open ? "translateY(6px) rotate(45deg)" : "none" }}
        />
        <span
          className="block h-px w-6 bg-editorial-text transition-opacity duration-200"
          style={{ opacity: open ? 0 : 1 }}
        />
        <span
          className="block h-px w-6 bg-editorial-text transition-transform duration-300"
          style={{ transform: open ? "translateY(-6px) rotate(-45deg)" : "none" }}
        />
      </button>

      {/* Mobile dropdown menu */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 top-0 z-40"
            onClick={() => setOpen(false)}
          />
          <nav className="md:hidden absolute top-full left-0 right-0 z-50 bg-editorial-bg border-b border-editorial-divider flex flex-col px-6">
            {NAV.map((item) => (
              <button
                key={item.page}
                onClick={() => go(item.to)}
                className={`text-left py-4 text-[11px] uppercase tracking-[0.24em] border-b border-editorial-divider last:border-b-0 transition-colors ${
                  activePage === item.page
                    ? "text-editorial-text"
                    : "text-editorial-label hover:text-editorial-text"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </header>
  );
};

export default SiteHeader;
