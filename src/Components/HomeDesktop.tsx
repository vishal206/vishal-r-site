import { Link, NavigateFunction } from "react-router-dom";
import MovieDisk from "./MovieDisk";
import CornerPile, { STICKER } from "./CornerPile";
import SocialLinks from "./SocialLinks";
import { BlogPostMeta, ProjectMeta, Book } from "../Utils/markdownLoader";
import {
  BOTTOM_REST,
  BOTTOM_SPREAD,
  bottomBlogRest,
  bottomBunch,
} from "../Utils/pilePositions";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

const isImageLogo = (logo: string) =>
  !!logo && (logo.startsWith("/") || logo.startsWith("http"));

const HomeDesktop = ({
  navigate,
  books,
  movies,
  writing,
  projects,
}: {
  navigate: NavigateFunction;
  books: Book[];
  movies: BlogPostMeta[];
  writing: BlogPostMeta[];
  projects: ProjectMeta[];
}) => {
  return (
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
        <Link to="/about" className="hover:text-editorial-text transition-colors">
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
        <SocialLinks />
      </div>
    </div>
  );
};

export default HomeDesktop;
