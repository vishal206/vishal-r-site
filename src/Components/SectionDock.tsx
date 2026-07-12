import { NavigateFunction } from "react-router-dom";
import MovieDisk from "./MovieDisk";
import CornerPile, { STICKER } from "./CornerPile";
import { BlogPostMeta, ProjectMeta, Book } from "../Utils/markdownLoader";
import {
  BOTTOM_REST,
  BOTTOM_SPREAD,
  bottomBlogRest,
  bottomBunch,
} from "../Utils/pilePositions";
import { SectionId, SECTION_LABELS } from "../Utils/sections";

const isImageLogo = (logo: string) =>
  !!logo && (logo.startsWith("/") || logo.startsWith("http"));

// A section sticker: the tappable label that raises the section sheet. When its
// section is the one currently open it lifts up to read as "active".
const StickerButton = ({
  id,
  active,
  onSelect,
  children,
}: {
  id: SectionId;
  active: SectionId | null;
  onSelect: (id: SectionId) => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={() => onSelect(id)}
    aria-label={SECTION_LABELS[id]}
    className={`cursor-pointer transition-transform duration-300 ease-out ${
      active === id ? "-translate-y-3" : "hover:-translate-y-1"
    }`}
  >
    {children}
  </button>
);

const SectionDock = ({
  navigate,
  books,
  movies,
  writing,
  projects,
  active,
  onSelect,
  onHome,
}: {
  navigate: NavigateFunction;
  books: Book[];
  movies: BlogPostMeta[];
  writing: BlogPostMeta[];
  projects: ProjectMeta[];
  active: SectionId | null;
  onSelect: (id: SectionId) => void;
  onHome: () => void;
}) => {
  return (
    <>
      {/* ── Sticker piles that fan their items open on hover. Shown at every
          breakpoint; the whole row scales down toward its bottom-center on
          smaller screens so all five stickers stay on screen. ── */}
      <div
        className={`flex absolute bottom-0 inset-x-0 z-40 justify-center items-end gap-8 xl:gap-20 px-10 pb-0 origin-bottom transition-transform duration-500 ease-out ${
          active
            ? "scale-[0.36] sm:scale-[0.55] md:scale-[0.72] lg:scale-[0.6]"
            : "scale-[0.36] sm:scale-[0.55] md:scale-[0.72] lg:scale-100"
        }`}
      >
        {/* Home — the Vishal sticker returns to the home screen */}
        <button
          onClick={onHome}
          aria-label="Home"
          // Lifted ~26px: unlike the other stickers this PNG has almost no
          // transparent bottom padding, so its content otherwise hangs lower
          // than the rest when their image boxes are bottom-aligned.
          style={{ marginBottom: 26 }}
          className="shrink-0 self-end cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1"
        >
          <img
            src="/assets/stickers/vishal-sticker.png"
            alt="Home"
            style={{ height: 105, maxWidth: "none", transform: "rotate(-2deg)" }}
            className="block select-none"
          />
        </button>

        {/* Movies as CDs */}
        <CornerPile
          wrapperClass="shrink-0"
          boxClass="relative w-44 h-44"
          rest={BOTTOM_REST}
          spread={BOTTOM_SPREAD}
          stickerStyle={{ left: "50%", bottom: 0, transform: "translateX(-50%)", zIndex: 40 }}
          sticker={
            <StickerButton id="movies" active={active} onSelect={onSelect}>
              <img
                src="/assets/stickers/movie-sticker.png"
                alt="Movies"
                style={{ height: 150, maxWidth: "none", transform: "rotate(-4deg)" }}
                className="block select-none"
              />
            </StickerButton>
          }
          items={movies.map((post) => ({
            key: post.slug,
            title: post.title,
            onClick: () => navigate(`/archive/${post.slug}`),
            node: (
              <div style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.6))" }}>
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
            <StickerButton id="books" active={active} onSelect={onSelect}>
              <img
                src="/assets/stickers/book-sticker.png"
                alt="Books"
                style={{ height: 150, maxWidth: "none", transform: "rotate(3deg)" }}
                className="block select-none"
              />
            </StickerButton>
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
            <StickerButton id="projects" active={active} onSelect={onSelect}>
              <img
                src="/assets/stickers/project-sticker.png"
                alt="Projects"
                style={{ height: 150, maxWidth: "none", transform: "rotate(-3deg)" }}
                className="block select-none"
              />
            </StickerButton>
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
                  <img src={p.logo} alt={p.title} className="w-full h-full object-cover" />
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
            <StickerButton id="blog" active={active} onSelect={onSelect}>
              <img
                src="/assets/stickers/blog-sticker.png"
                alt="Blog"
                style={{ height: 150, maxWidth: "none", transform: "rotate(4deg)" }}
                className="block select-none"
              />
            </StickerButton>
          }
          items={writing.map((b) => ({
            key: b.slug,
            title: b.title,
            onClick: () => navigate(`/archive/${b.slug}`),
            node: (
              <div className={`w-32 rounded-xl overflow-hidden ${STICKER}`}>
                {b.image ? (
                  <img src={b.image} alt={b.title} className="w-full h-20 object-cover" />
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
    </>
  );
};

export default SectionDock;
