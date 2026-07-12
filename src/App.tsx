import { useState, useEffect, useMemo, ReactNode, CSSProperties } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import MovieDisk from "./components/MovieDisk";
import {
  BlogPostMeta,
  ProjectMeta,
  getBooksSync,
  getAllProjectsMeta,
} from "./Utils/markdownLoader";
import { fetchBlogPosts } from "./Utils/functions";
import Vishal_Resume from "./assets/Vishal_Resume.pdf";

// Each corner pile hides its items behind a sticker at rest, then fans them out
// diagonally away from the corner on hover (rabbit-from-a-bush). REST = near the
// corner (hidden); SPREAD = fanned toward the interior, covering the sticker.
type Pos = { x: number; y: number; r: number };

// Bottom-row piles: items cluster behind the sticker at rest, fan upward on hover.
const BOTTOM_REST: Pos[] = [
  { x: 42, y: 96, r: -6 },
  { x: 58, y: 104, r: 6 },
  { x: 50, y: 114, r: -3 },
];
const BOTTOM_SPREAD: Pos[] = [
  { x: 2, y: 22, r: -12 },
  { x: 96, y: 26, r: 10 },
  { x: 48, y: -16, r: -4 },
];

// Blog: rest clustered behind the sticker, spread into a circular bunch above it.
const bottomBlogRest = (i: number): Pos => ({
  x: 60 + ((i % 3) - 1) * 7,
  y: 96 + Math.floor(i / 3) * 3,
  r: i % 2 ? 5 : -5,
});
const bunchPos = (i: number, n: number): Pos => {
  if (i < 3) {
    const spots: [number, number, number][] = [
      [0, 0, -5],
      [18, 12, 7],
      [-14, 16, -9],
    ];
    const [x, y, r] = spots[i];
    return { x, y, r };
  }
  const ringCount = Math.max(n - 3, 1);
  const k = i - 3;
  const ang = (k / ringCount) * Math.PI * 2 + 0.5;
  const rad = 60 + Math.sin(i * 53.3) * 16;
  const x = Math.cos(ang) * rad + Math.sin(i * 17.1) * 8;
  const y = Math.sin(ang) * rad + 28 + Math.cos(i * 11.7) * 8;
  const r = Math.sin(i * 12.9) * 18;
  return { x, y, r };
};

// Same bunch, shifted so it fans up and centred above the bottom-row sticker.
const bottomBunch = (i: number, n: number): Pos => {
  const p = bunchPos(i, n);
  return { x: p.x + 56, y: p.y - 30, r: p.r };
};

// A corner pile: items hidden behind a sticker at rest, fanned out on hover.
const CornerPile = ({
  wrapperClass,
  boxClass,
  items,
  rest,
  spread,
  sticker,
  stickerStyle,
  restScale = 0.85,
  hoverScale = 1.05,
}: {
  wrapperClass: string;
  boxClass: string;
  items: { key: string; title: string; onClick: () => void; node: ReactNode }[];
  rest: Pos[];
  spread: Pos[];
  sticker: ReactNode;
  stickerStyle: CSSProperties;
  restScale?: number;
  hoverScale?: number;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <div className={wrapperClass}>
      <div className={boxClass}>
        {items.map((it, i) => {
          const p = hover ? spread[i % spread.length] : rest[i % rest.length];
          return (
            <div
              key={it.key}
              title={it.title}
              onClick={it.onClick}
              style={{
                zIndex: items.length - i,
                opacity: hover ? 1 : 0,
                pointerEvents: hover ? "auto" : "none",
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${hover ? hoverScale : restScale})`,
              }}
              className="absolute top-0 left-0 cursor-pointer transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            >
              {it.node}
            </div>
          );
        })}
        <div
          className="absolute"
          style={stickerStyle}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {sticker}
        </div>
      </div>
    </div>
  );
};

// Shared die-cut sticker chrome: thick white edge + lift shadow.
const STICKER =
  "border-[3px] border-white bg-editorial-bg shadow-[0_12px_28px_-8px_rgba(0,0,0,0.8)]";

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

  const isImageLogo = (logo: string) =>
    !!logo && (logo.startsWith("/") || logo.startsWith("http"));

  return (
    <div
      className="relative min-h-screen lg:h-screen lg:overflow-hidden bg-editorial-bg text-editorial-text font-primary"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.3px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* ══════════════ DESKTOP: full-screen sticker wall ══════════════ */}
      <div className="hidden lg:block absolute inset-0">
        {/* Name — sits behind the portrait's head */}
        <h1
          className="absolute left-1/2 top-[9%] -translate-x-1/2 z-10 text-center font-display font-black leading-none whitespace-nowrap select-none"
          style={{ fontSize: "clamp(5rem, 13vw, 12rem)" }}
        >
          Vishal R
        </h1>

        {/* ── Section piles arranged along the bottom, fanning upward ── */}
        <div className="absolute bottom-0 inset-x-0 z-30 flex justify-center items-end gap-8 xl:gap-20 px-10 pb-0">
        {/* Movies as CDs */}
        <CornerPile
          wrapperClass="shrink-0"
          boxClass="relative w-44 h-44"
          rest={BOTTOM_REST}
          spread={BOTTOM_SPREAD}
          stickerStyle={{ left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 40 }}
          sticker={
            <Link to="/movies">
              <img
                src="/assets/stickers/movie-sticker.png"
                alt="Movies"
                style={{
                  height: 150,
                  maxWidth: "none",
                  transform: "rotate(-4deg)",
                }}
                className="block select-none transition-transform duration-300 ease-out hover:rotate-0 hover:scale-105"
              />
            </Link>
          }
          items={movies.map((post) => ({
            key: post.slug,
            title: post.title,
            onClick: () => navigate(`/archive/${post.slug}`),
            node: (
              <div
                style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.6))" }}
              >
                <MovieDisk post={post} tilt={0} diskClassName="w-28 h-28" />
              </div>
            ),
          }))}
        />

        {/* Books */}
        <CornerPile
          wrapperClass="shrink-0"
          boxClass="relative w-44 h-44"
          rest={BOTTOM_REST}
          spread={BOTTOM_SPREAD}
          stickerStyle={{ left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 40 }}
          sticker={
            <Link to="/books">
              <img
                src="/assets/stickers/book-sticker.png"
                alt="Books"
                style={{
                  height: 150,
                  maxWidth: "none",
                  transform: "rotate(3deg)",
                }}
                className="block select-none transition-transform duration-300 ease-out hover:rotate-0 hover:scale-105"
              />
            </Link>
          }
          items={books.slice(0, 3).map((book) => ({
            key: book.slug,
            title: book.title,
            onClick: () => navigate(`/book/${book.slug}`),
            node: (
              <div className={`w-24 rounded-md overflow-hidden ${STICKER}`}>
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div
                    className="w-full aspect-[2/3] flex items-center justify-center p-2 text-center text-[11px] font-display font-bold"
                    style={{ background: book.accent || "#333" }}
                  >
                    {book.title}
                  </div>
                )}
              </div>
            ),
          }))}
        />

        {/* Projects */}
        <CornerPile
          wrapperClass="shrink-0"
          boxClass="relative w-44 h-44"
          rest={BOTTOM_REST}
          spread={BOTTOM_SPREAD}
          stickerStyle={{ left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 40 }}
          sticker={
            <img
              src="/assets/stickers/project-sticker.png"
              alt="Projects"
              style={{
                height: 150,
                maxWidth: "none",
                transform: "rotate(-3deg)",
              }}
              className="block cursor-pointer select-none transition-transform duration-300 ease-out hover:rotate-0 hover:scale-105"
            />
          }
          items={projects.slice(0, 3).map((p) => ({
            key: p.slug,
            title: p.title,
            onClick: () => navigate(`/projects/${p.slug}`),
            node: (
              <div
                className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center bg-white ${STICKER}`}
              >
                {isImageLogo(p.logo) ? (
                  <img
                    src={p.logo}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl select-none">{p.logo || "📦"}</span>
                )}
              </div>
            ),
          }))}
        />

        {/* Blog — circular bunch */}
        <CornerPile
          wrapperClass="shrink-0"
          boxClass="relative w-44 h-44"
          rest={writing.map((_, i) => bottomBlogRest(i))}
          spread={writing.map((_, i) => bottomBunch(i, writing.length))}
          stickerStyle={{ left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 40 }}
          sticker={
            <Link to="/archive">
              <img
                src="/assets/stickers/blog-sticker.png"
                alt="Blog"
                style={{ height: 150, maxWidth: "none", transform: "rotate(4deg)" }}
                className="block select-none transition-transform duration-300 ease-out hover:rotate-0 hover:scale-105"
              />
            </Link>
          }
          items={writing.map((b) => ({
            key: b.slug,
            title: b.title,
            onClick: () => navigate(`/archive/${b.slug}`),
            node: (
              <div className={`w-32 rounded-xl overflow-hidden ${STICKER}`}>
                {b.image ? (
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-full h-20 object-cover"
                  />
                ) : null}
                <div className="px-2.5 py-2">
                  <p className="text-[13px] font-display font-bold leading-snug line-clamp-2">
                    {b.title}
                  </p>
                </div>
              </div>
            ),
          }))}
        />
        </div>

        {/* ── Below the name: minimal nav / socials ── */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-editorial-label">
          <Link
            to="/about"
            className="hover:text-editorial-text transition-colors"
          >
            About
          </Link>
          <a
            href={Vishal_Resume}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-editorial-text transition-colors"
          >
            Résumé
          </a>
          <span className="flex items-center gap-4">
            <a
              href="https://linkedin.com/in/vishal-r-profile"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-editorial-text transition-colors"
            >
              <FontAwesomeIcon icon={faLinkedin} className="text-base" />
            </a>
            <a
              href="https://github.com/vishal206"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-editorial-text transition-colors"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://x.com/vishal_r_dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="hover:text-editorial-text transition-colors"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </span>
        </div>
      </div>

      {/* ══════════════ MOBILE / TABLET: scrollable stack ══════════════ */}
      <div className="lg:hidden px-6 py-10 flex flex-col items-center text-center">
        <h1 className="font-display font-black leading-none text-6xl mb-6">
          Vishal R
        </h1>

        <nav className="grid grid-cols-2 gap-3 w-full max-w-xs mt-10">
          {[
            { to: "/movies", label: "Movies" },
            { to: "/books", label: "Books" },
            { to: "/archive", label: "Blog" },
            { to: "/about", label: "About" },
          ].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="py-4 rounded-xl border border-editorial-divider text-[11px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6 mt-8 text-editorial-label">
          <a
            href={Vishal_Resume}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.2em] hover:text-editorial-text"
          >
            Résumé
          </a>
          <a
            href="https://linkedin.com/in/vishal-r-profile"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-editorial-text"
          >
            <FontAwesomeIcon icon={faLinkedin} className="text-base" />
          </a>
          <a
            href="https://github.com/vishal206"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-editorial-text"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <a
            href="https://x.com/vishal_r_dev"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter / X"
            className="hover:text-editorial-text"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
