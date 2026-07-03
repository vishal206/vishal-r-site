import type { Book as BookType } from "../Utils/markdownLoader";

type Props = {
  book: BookType;
  className?: string;
};

/**
 * The book's front cover. Uses the md `cover` image when present, otherwise a
 * typographic fallback. Fills its (aspect-sized) parent.
 */
const BookCover = ({ book, className = "" }: Props) => {
  const accent = book.accent ?? "#3a3a3a";

  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-[3px] ${className}`}
      style={{
        background: book.cover
          ? "#0e0e0e"
          : `linear-gradient(135deg, ${accent} 0%, #1b1b1b 92%)`,
        boxShadow:
          "0 22px 40px -18px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.4)",
      }}
    >
      {book.cover ? (
        <img
          src={book.cover}
          alt={book.title}
          draggable={false}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col p-[9%] text-left">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.14), transparent 55%)",
            }}
          />
          <div
            className="uppercase tracking-[0.24em] mb-auto text-[8px]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {book.genres[0]}
          </div>
          <div className="font-display font-bold leading-[1.08] text-white text-base md:text-lg">
            {book.title}
          </div>
          <div
            className="mt-2 pt-2 uppercase tracking-[0.18em] text-[8px]"
            style={{
              color: "rgba(255,255,255,0.7)",
              borderTop: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {book.author}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCover;
