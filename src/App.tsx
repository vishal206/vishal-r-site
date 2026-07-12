import { useState, useEffect, useMemo, ReactNode } from "react";
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
import {
  siReact,
  siNodedotjs,
  siPython,
  siLangchain,
  siQlik,
} from "simple-icons";
import Vishal_Resume from "./assets/Vishal_Resume.pdf";

// simple-icons has no standalone OpenAI mark (trademark-removed), so it's inlined.
const OPENAI_PATH =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";

const STACK: { title: string; path: string; hex: string }[] = [
  { title: siReact.title, path: siReact.path, hex: `#${siReact.hex}` },
  { title: siNodedotjs.title, path: siNodedotjs.path, hex: `#${siNodedotjs.hex}` },
  { title: siPython.title, path: siPython.path, hex: `#${siPython.hex}` },
  { title: siLangchain.title, path: siLangchain.path, hex: `#${siLangchain.hex}` },
  { title: "OpenAI", path: OPENAI_PATH, hex: "#10A37F" },
  { title: siQlik.title, path: siQlik.path, hex: `#${siQlik.hex}` },
];

// Overlapping placements for the tech icons — mixed sizes, piled.
const TECH_LAYOUT = [
  { x: 0, y: 14, size: 62, rot: -10 },
  { x: 48, y: 0, size: 50, rot: 9 },
  { x: 80, y: 30, size: 70, rot: -6 },
  { x: 20, y: 54, size: 56, rot: 13 },
  { x: 62, y: 72, size: 48, rot: -14 },
  { x: 112, y: 8, size: 56, rot: 7 },
];

// Die-cut sticker backing per tech icon — flat colour + shape, like a sticker sheet.
const TECH_STICKERS = [
  { bg: "#61DAFB", fg: "#1a1a1a", shape: "circle" },
  { bg: "#2FA84F", fg: "#ffffff", shape: "squircle" },
  { bg: "#F4B740", fg: "#1a1a1a", shape: "sun" },
  { bg: "#6C63FF", fg: "#ffffff", shape: "oval" },
  { bg: "#1F6E6E", fg: "#ffffff", shape: "rect" },
  { bg: "#F7A8C4", fg: "#1a1a1a", shape: "circle" },
];

// Sunburst clip-path: alternating outer/inner radii around a circle.
const sunburst = (spikes = 12, outer = 50, inner = 33) => {
  const pts: string[] = [];
  const total = spikes * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const ang = (Math.PI * 2 * i) / total - Math.PI / 2;
    pts.push(
      `${(50 + r * Math.cos(ang)).toFixed(1)}% ${(50 + r * Math.sin(ang)).toFixed(1)}%`,
    );
  }
  return `polygon(${pts.join(", ")})`;
};
const SUN_CLIP = sunburst();

const shapeDims = (
  shape: string,
  size: number,
): { w: number; h: number; radius: number | string } => {
  switch (shape) {
    case "squircle":
      return { w: size, h: size, radius: size * 0.34 };
    case "blob":
      return { w: size, h: size, radius: "62% 38% 55% 45% / 58% 50% 50% 42%" };
    case "oval":
      return { w: Math.round(size * 1.4), h: size, radius: 9999 };
    case "rect":
      return { w: Math.round(size * 1.3), h: Math.round(size * 0.9), radius: 14 };
    case "sun":
      return { w: Math.round(size * 1.25), h: Math.round(size * 1.25), radius: 0 };
    default: // circle
      return { w: size, h: size, radius: 9999 };
  }
};

// Rotations/offsets that make a small group read as a tossed-down pile.
const PILE_TF = [
  "rotate(-8deg)",
  "translate(34px, 30px) rotate(7deg)",
  "translate(10px, 58px) rotate(-4deg)",
];

// The blog pile is a circular "bunch": the 3 latest sit on top in the middle,
// the rest ring around behind them in a random-looking circular scatter.
const bunchTf = (i: number, n: number) => {
  if (i < 3) {
    const spots: [number, number, number][] = [
      [0, 0, -5],
      [18, 12, 7],
      [-14, 16, -9],
    ];
    const [x, y, r] = spots[i];
    return `translate(${x}px, ${y}px) rotate(${r}deg)`;
  }
  const ringCount = Math.max(n - 3, 1);
  const k = i - 3;
  const ang = (k / ringCount) * Math.PI * 2 + 0.5;
  const rad = 60 + Math.sin(i * 53.3) * 16; // jittered radius
  const x = Math.cos(ang) * rad + Math.sin(i * 17.1) * 8;
  const y = Math.sin(ang) * rad + 28 + Math.cos(i * 11.7) * 8; // ring nudged down
  const rot = Math.sin(i * 12.9) * 18;
  return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
};

// A single sticker in a pile: absolutely stacked, straightens + lifts on hover.
const PileItem = ({
  i,
  tf,
  z,
  onClick,
  title,
  children,
}: {
  i: number;
  tf?: string;
  z?: number;
  onClick?: () => void;
  title?: string;
  children: ReactNode;
}) => (
  <div
    onClick={onClick}
    title={title}
    style={{ transform: tf ?? PILE_TF[i % PILE_TF.length], zIndex: z }}
    className="absolute top-0 left-0 cursor-pointer hover:!z-50"
  >
    <div className="transition-transform duration-300 ease-out hover:rotate-0 hover:scale-110 hover:-translate-y-1.5">
      {children}
    </div>
  </div>
);

// Shared die-cut sticker chrome: thick white edge + lift shadow.
const STICKER =
  "border-[3px] border-white bg-editorial-bg shadow-[0_12px_28px_-8px_rgba(0,0,0,0.8)]";

const SectionLabel = ({ to, children }: { to?: string; children: ReactNode }) =>
  to ? (
    <Link
      to={to}
      className="inline-block text-[10px] uppercase tracking-[0.22em] text-available hover:opacity-70 transition-opacity"
    >
      {children}
    </Link>
  ) : (
    <span className="inline-block text-[10px] uppercase tracking-[0.22em] text-editorial-label">
      {children}
    </span>
  );

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

        {/* Portrait — hero cutout sticker, flush to the bottom-middle. The jpeg
            has empty space under the shoulders, so a negative bottom pulls the
            subject down to the screen edge. */}
        <img
          src="/assets/vishal-pic.jpeg"
          alt="Vishal R"
          className="absolute left-1/2 -bottom-12 -translate-x-1/2 z-20 block w-[24rem] xl:w-[27rem] select-none pointer-events-none"
          style={{ mixBlendMode: "lighten" }}
        />

        {/* Tech stack — bare icons piled on the portrait's left shoulder (z above it) */}
        <div className="absolute left-1/2 top-[80%] -translate-x-[11rem] xl:-translate-x-[12rem] z-30">
          <div className="relative w-44 h-36">
            {STACK.map((s, i) => {
              const t = TECH_LAYOUT[i % TECH_LAYOUT.length];
              const st = TECH_STICKERS[i % TECH_STICKERS.length];
              const { w, h, radius } = shapeDims(st.shape, t.size);
              const isSun = st.shape === "sun";
              const icon = Math.round(Math.min(w, h) * (isSun ? 0.36 : 0.52));
              return (
                <div
                  key={s.title}
                  title={s.title}
                  style={{
                    left: t.x,
                    top: t.y,
                    transform: `rotate(${t.rot}deg)`,
                    filter: "drop-shadow(0 4px 7px rgba(0,0,0,0.5))",
                    zIndex: isSun ? 30 : undefined,
                  }}
                  className="absolute transition-transform duration-300 ease-out hover:!rotate-0 hover:scale-125 hover:z-50"
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: w,
                      height: h,
                      background: st.bg,
                      ...(isSun
                        ? { clipPath: SUN_CLIP }
                        : { borderRadius: radius }),
                    }}
                  >
                    <svg viewBox="0 0 24 24" width={icon} height={icon} fill={st.fg}>
                      <path d={s.path} />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top-left: Movies as CDs ── */}
        <div className="absolute top-8 left-8 z-30">
          <div className="mb-3">
            <SectionLabel to="/movies">Movies →</SectionLabel>
          </div>
          <div className="relative w-52 h-52">
            {movies.map((post, i) => (
              <PileItem
                key={post.slug}
                i={i}
                title={post.title}
                onClick={() => navigate(`/archive/${post.slug}`)}
              >
                <div style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.6))" }}>
                  <MovieDisk post={post} tilt={0} diskClassName="w-28 h-28" />
                </div>
              </PileItem>
            ))}
          </div>
        </div>

        {/* ── Bottom-left: Books ── */}
        <div className="absolute bottom-8 left-8 z-30">
          <div className="relative w-52 h-56">
            {books.slice(0, 3).map((book, i) => (
              <PileItem
                key={book.slug}
                i={i}
                title={book.title}
                onClick={() => navigate(`/book/${book.slug}`)}
              >
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
              </PileItem>
            ))}
          </div>
          <div className="mt-3">
            <SectionLabel to="/books">Books →</SectionLabel>
          </div>
        </div>

        {/* ── Top-right: Projects as icon stickers ── */}
        <div className="absolute top-8 right-8 z-30 flex flex-col items-end">
          <div className="mb-3">
            <SectionLabel>Projects</SectionLabel>
          </div>
          <div className="relative w-52 h-52">
            {projects.slice(0, 3).map((p, i) => (
              <PileItem
                key={p.slug}
                i={i}
                title={p.title}
                onClick={() => navigate(`/projects/${p.slug}`)}
              >
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
              </PileItem>
            ))}
          </div>
        </div>

        {/* ── Bottom-right: Blogs — circular bunch, 3 latest on top ── */}
        <div className="absolute bottom-12 right-12 z-30 flex flex-col items-end">
          <div className="relative w-52 h-52">
            {writing.map((b, i) => (
              <PileItem
                key={b.slug}
                i={i}
                tf={bunchTf(i, writing.length)}
                z={writing.length - i}
                title={b.title}
                onClick={() => navigate(`/archive/${b.slug}`)}
              >
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
              </PileItem>
            ))}
          </div>
          <div className="mt-3">
            <SectionLabel to="/archive">Blog →</SectionLabel>
          </div>
        </div>

        {/* ── Below the name: minimal nav / socials ── */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-editorial-label">
          <Link to="/about" className="hover:text-editorial-text transition-colors">
            About
          </Link>
          <a href={Vishal_Resume} target="_blank" rel="noopener noreferrer" className="hover:text-editorial-text transition-colors">
            Résumé
          </a>
          <span className="flex items-center gap-4">
            <a href="https://linkedin.com/in/vishal-r-profile" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-editorial-text transition-colors">
              <FontAwesomeIcon icon={faLinkedin} className="text-base" />
            </a>
            <a href="https://github.com/vishal206" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-editorial-text transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg>
            </a>
            <a href="https://x.com/vishal_r_dev" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="hover:text-editorial-text transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
          </span>
        </div>
      </div>

      {/* ══════════════ MOBILE / TABLET: scrollable stack ══════════════ */}
      <div className="lg:hidden px-6 py-10 flex flex-col items-center text-center">
        <h1 className="font-display font-black leading-none text-6xl mb-6">
          Vishal R
        </h1>
        <img
          src="/assets/vishal-pic.jpeg"
          alt="Vishal R"
          className="w-56 select-none"
          style={{ mixBlendMode: "lighten" }}
        />
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {STACK.map((s) => (
            <div key={s.title} title={s.title} className={`w-11 h-11 rounded-full flex items-center justify-center bg-white ${STICKER}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill={s.hex}><path d={s.path} /></svg>
            </div>
          ))}
        </div>

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
          <a href={Vishal_Resume} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] hover:text-editorial-text">Résumé</a>
          <a href="https://linkedin.com/in/vishal-r-profile" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-editorial-text"><FontAwesomeIcon icon={faLinkedin} className="text-base" /></a>
          <a href="https://github.com/vishal206" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-editorial-text"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg></a>
          <a href="https://x.com/vishal_r_dev" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="hover:text-editorial-text"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
        </div>
      </div>
    </div>
  );
};

export default App;
