import { Link } from "react-router-dom";

type Props = {
  /** Poster artwork. Without one the poster falls back to its title on a plain card. */
  src?: string | null;
  title: string;
  /** Where the poster links on this site (a review). */
  to?: string | null;
  /** Off-site link (the film's TMDB page). Opens in a new tab. */
  href?: string | null;
  /** Tailwind width classes; height follows from the 2:3 sheet. */
  className?: string;
  /** -1 to keep the link out of the tab order (e.g. a looped duplicate). */
  tabIndex?: number;
};

// A single 2:3 movie poster. Just the sheet — how posters stack, overlap and
// pop on hover is up to whatever lays them out (see MovieShelf).
const MoviePoster = ({
  src,
  title,
  to,
  href,
  className = "w-24",
  tabIndex,
}: Props) => {
  const sheet = (
    <div
      className={`${className} aspect-[2/3] overflow-hidden rounded-md bg-editorial-divider shadow-[0_10px_24px_-8px_rgba(0,0,0,0.85)]`}
    >
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover select-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] font-display font-bold leading-snug text-editorial-muted">
          {title}
        </div>
      )}
    </div>
  );

  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex}>
        {sheet}
      </a>
    );
  if (to)
    return (
      <Link to={to} tabIndex={tabIndex}>
        {sheet}
      </Link>
    );
  return sheet;
};

export default MoviePoster;
