import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faFileLines, faRss } from "@fortawesome/free-solid-svg-icons";
import { ARTICLE_TAGS, tagFromParam } from "../Utils/articleTags";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

// Icons sit grey like the nav text and take their brand colour on hover.
const SOCIALS = [
  // GitHub's mark is near-black, which vanishes on our dark background, so it
  // uses its white-on-dark variant.
  {
    label: "GitHub",
    href: "https://github.com/vishal206",
    icon: faGithub,
    color: "#FFFFFF",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/vishal-r-profile",
    icon: faLinkedin,
    color: "#0A66C2",
  },
  { label: "RSS", href: "/rss.xml", icon: faRss, color: "#FFA500" },
  // No brand to borrow here; PDF red reads as "document".
  { label: "Résumé", href: Vishal_Resume, icon: faFileLines, color: "#EC1C24" },
];

const navItemClass = (isActive: boolean) =>
  `font-name text-base transition-colors cursor-pointer ${
    isActive
      ? "text-editorial-text"
      : "text-editorial-label hover:text-editorial-text"
  }`;

// "Articles" opens a menu of classifications rather than linking straight to
// the list; each entry lands on /archive filtered by ?tag=.
const ArticlesMenu = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onArchive = pathname === "/archive";
  const currentTag = onArchive ? tagFromParam(searchParams.get("tag")) : null;

  // Close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1.5 ${navItemClass(onArchive)}`}
      >
        Articles
        <svg
          viewBox="0 0 10 6"
          aria-hidden="true"
          className={`w-2 h-2 fill-current transition-transform ${
            open ? "" : "rotate-180"
          }`}
        >
          <path d="M5 0 10 6H0z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 z-50 min-w-40 py-2 rounded-xl border border-editorial-divider bg-editorial-bg shadow-[0_12px_28px_-8px_rgba(0,0,0,0.8)]"
        >
          {ARTICLE_TAGS.map((tag) => (
            <Link
              key={tag}
              to={`/archive?tag=${tag}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 ${navItemClass(
                currentTag === tag.toLowerCase(),
              )}`}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const PAGES = [
  { label: "Projects", to: "/projects" },
  { label: "About", to: "/about" },
];

// The row under the name: page links on the left, social icons on the right.
const Navigation = () => (
  <nav className="flex items-center gap-5">
    <ArticlesMenu />
    {PAGES.map(({ label, to }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => navItemClass(isActive)}
      >
        {label}
      </NavLink>
    ))}
    <div className="ml-auto hidden md:flex items-center gap-4">
      {SOCIALS.map(({ label, href, icon, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          style={{ "--brand": color } as React.CSSProperties}
          className="text-editorial-label transition-colors hover:[color:var(--brand)]"
        >
          <FontAwesomeIcon icon={icon} className="text-base" />
        </a>
      ))}
    </div>
  </nav>
);

export default Navigation;
