import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Book as BookType } from "../Utils/markdownLoader";
import BookCover from "./BookCover";

type Props = { books: BookType[] };

/** Pick a legible text colour for a given spine background. */
const readableOn = (hex?: string) => {
  const h = (hex ?? "").replace("#", "");
  if (h.length !== 6) return "#f5f2ec";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? "#1a1a1a" : "#f5f2ec";
};

const formatYear = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : String(d.getFullYear());
};

const BookShelf = ({ books }: Props) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [dims, setDims] = useState({ H: 340, coverW: 226, spineW: 46 });
  // Natural aspect ratio (width ÷ height) of each book's cover and side images,
  // so a book's width can fit its artwork at the shelf height.
  const [ratios, setRatios] = useState<
    Record<string, { cover?: number; side?: number }>
  >({});

  // Responsive book dimensions.
  useEffect(() => {
    const update = () => {
      const H = window.innerWidth < 640 ? 320 : 460;
      setDims({
        H,
        coverW: Math.round((H * 2) / 3),
        spineW: Math.round(H * 0.135),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Measure each image's aspect ratio once loaded.
  useEffect(() => {
    let alive = true;
    const load = (slug: string, url: string | undefined, key: "cover" | "side") => {
      if (!url) return;
      const img = new Image();
      img.onload = () => {
        if (!alive || !img.naturalHeight) return;
        setRatios((r) => ({
          ...r,
          [slug]: { ...r[slug], [key]: img.naturalWidth / img.naturalHeight },
        }));
      };
      img.src = url;
    };
    books.forEach((b) => {
      load(b.slug, b.cover, "cover");
      load(b.slug, b.side, "side");
    });
    return () => {
      alive = false;
    };
  }, [books]);

  // Track which book is nearest the horizontal centre.
  const rafRef = useRef(0);
  const recomputeActive = () => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    itemRefs.current.forEach((it, i) => {
      if (!it) return;
      const c = it.offsetLeft + it.offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActive(best);
  };
  const onScroll = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(recomputeActive);
  };

  const centerItem = (i: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    const it = itemRefs.current[i];
    if (!el || !it) return;
    el.scrollTo({
      left: it.offsetLeft + it.offsetWidth / 2 - el.clientWidth / 2,
      behavior,
    });
  };

  // Centre the first book on mount / whenever the set of books changes.
  useLayoutEffect(() => {
    setActive(0);
    requestAnimationFrame(() => centerItem(0, "auto"));
  }, [books, dims.coverW]);

  // Image sizes arrive asynchronously and shift the layout — keep the focused
  // book centred as widths settle.
  useLayoutEffect(() => {
    centerItem(active, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratios, dims]);

  const handleClick = (i: number) => {
    if (i === active) navigate(`/book/${books[i].slug}`);
    else centerItem(i);
  };

  // Hovering a book brings it into focus (debounced so sweeping across the
  // shelf doesn't fire on every spine).
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleHover = (i: number) => {
    if (i === active) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => centerItem(i), 60);
  };
  useEffect(() => () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  // Let a vertical wheel scroll the shelf horizontally.
  const onWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  // A book's on-shelf width fits its artwork's aspect ratio at the shelf height.
  const widthFor = (book: BookType, focused: boolean) => {
    const r = ratios[book.slug];
    if (focused) {
      return Math.round(dims.H * (r?.cover ?? 2 / 3));
    }
    return book.side && r?.side ? Math.round(dims.H * r.side) : dims.spineW;
  };

  const maxCoverW = Math.max(
    dims.coverW,
    ...books.map((b) => widthFor(b, true)),
  );
  const spacer = `calc(50% - ${maxCoverW / 2}px)`;
  const activeBook = books[active];

  return (
    <div className="relative select-none">
      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous"
        onClick={() => centerItem(Math.max(0, active - 1))}
        className="absolute left-1 md:left-3 top-1/2 -translate-y-1/2 z-20 text-editorial-label hover:text-editorial-text text-xl md:text-2xl cursor-pointer disabled:opacity-20"
        disabled={active === 0}
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => centerItem(Math.min(books.length - 1, active + 1))}
        className="absolute right-1 md:right-3 top-1/2 -translate-y-1/2 z-20 text-editorial-label hover:text-editorial-text text-xl md:text-2xl cursor-pointer disabled:opacity-20"
        disabled={active === books.length - 1}
      >
        →
      </button>

      {/* Shelf row */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onWheel={onWheel}
        className="flex items-end overflow-x-auto no-scrollbar snap-x snap-mandatory"
        style={{ height: dims.H + 40, scrollbarWidth: "none" }}
      >
        <div style={{ flex: `0 0 ${spacer}` }} />
        {books.map((book, i) => {
          const isActive = i === active;
          const textColor = readableOn(book.accent);
          return (
            <button
              key={book.slug}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              onClick={() => handleClick(i)}
              onMouseEnter={() => handleHover(i)}
              className="relative shrink-0 snap-center cursor-pointer focus:outline-none mx-2 md:mx-3"
              style={{
                width: widthFor(book, isActive),
                height: dims.H,
                transition: "width 450ms cubic-bezier(0.22,1,0.36,1)",
              }}
              aria-label={book.title}
            >
              {/* Spine layer — the book's `side` image, or a styled fallback */}
              <div
                className="absolute inset-0 rounded-[2px] overflow-hidden"
                style={{
                  opacity: isActive ? 0 : 1,
                  transition: "opacity 300ms ease",
                  boxShadow:
                    "0 22px 30px -20px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                {book.side ? (
                  <img
                    src={book.side}
                    alt={book.title}
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(90deg, rgba(0,0,0,0.4), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.32)), linear-gradient(180deg, ${book.accent ?? "#333"} 0%, rgba(0,0,0,0.35) 140%)`,
                    }}
                  >
                    <div
                      className="font-display font-bold tracking-wide text-center px-1 overflow-hidden"
                      style={{
                        writingMode: "vertical-rl",
                        color: textColor,
                        fontSize: dims.H < 300 ? "11px" : "13px",
                        maxHeight: "88%",
                      }}
                    >
                      {book.title}
                    </div>
                  </div>
                )}
              </div>

              {/* Cover layer */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 300ms ease",
                }}
              >
                <BookCover book={book} />
              </div>
            </button>
          );
        })}
        <div style={{ flex: `0 0 ${spacer}` }} />
      </div>

      {/* Caption */}
      <div className="text-center mt-7 min-h-[64px]">
        {activeBook && (
          <div key={activeBook.slug} className="animate-[fadeIn_400ms_ease]">
            <div className="uppercase tracking-[0.22em] text-[9px] text-available mb-2">
              {activeBook.genres.join(" · ")}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/book/${activeBook.slug}`)}
              className="font-display font-medium text-lg md:text-xl text-editorial-text hover:opacity-70 transition-opacity cursor-pointer leading-tight"
            >
              {activeBook.title}
            </button>
            <div className="uppercase tracking-[0.2em] text-[9px] text-editorial-label mt-1.5">
              {activeBook.author}
              {formatYear(activeBook.date) ? ` · ${formatYear(activeBook.date)}` : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookShelf;
