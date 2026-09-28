import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

// The header block: the Vishal sticker beside a stack of the links, the name
// and a tagline, the sticker exactly as tall as that stack. Heights are
// spelled out so they add up: links 18 + gap 6 + name 24 + gap 4 + tagline 10
// = 62 (phones), and 22 + 8 + 30 + 4 + 10 = 74 from md.
const LINK_SIZE = "text-lg md:text-[22px]";
// The résumé sticker's PNG isn't all sticker: the solid part spans 89.6% of
// the image's height (y 15–341 of 365), with a transparent margin above, a
// soft shadow below and 17px of margin on the left. So the image is drawn
// 1/0.896 = 1.116em tall and pulled in by those margins (in em, so it tracks
// LINK_SIZE at every breakpoint): the solid sticker then stands exactly as
// tall as the marks beside it, the same gap away, and the shadow hangs below.
const LINK_ART =
  "h-[1.116em] w-auto -mt-[0.046em] -mb-[0.07em] -ml-[0.052em] select-none";
const STICKER_SIZE = "h-[62px] md:h-[74px]";

// Path data for the plain marks, all on a 24×24 grid.
const GITHUB_PATH =
  "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.12.83-.26.83-.57v-2.2c-3.34.73-4.04-1.44-4.04-1.44-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.28-1.23 3.28-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.22.7.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z";
const LINKEDIN_PATH =
  "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z";
const RSS_PATH =
  "M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36zM4 4.44v3.57A12.01 12.01 0 0 1 15.99 20h3.57A15.57 15.57 0 0 0 4 4.44zM4 10.1v3.57c3.5 0 6.33 2.84 6.33 6.33h3.57c0-5.47-4.43-9.9-9.9-9.9z";

/**
 * A plain mark, painted in the link's current colour — a little smaller than
 * the link row (0.8em square), which the résumé sticker sets the height of.
 * `viewBox` crops a mark that doesn't fill its 24×24 grid down to its own
 * edges, so every mark stands the same height.
 */
const Mark = ({
  path,
  viewBox = "0 0 24 24",
}: {
  path: string;
  viewBox?: string;
}) => (
  <svg
    viewBox={viewBox}
    fill="currentColor"
    aria-hidden="true"
    className="h-[0.8em] w-[0.8em]"
  >
    <path d={path} />
  </svg>
);

// The plain marks — GitHub, LinkedIn, the RSS feed — in the name's colour
// until hovered, when each takes its brand colour. GitHub's brand colour is
// near-black, invisible on this background, so it brightens to white — how
// GitHub shows its mark on dark.
const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/vishal206",
    hover: "hover:text-white",
    mark: <Mark path={GITHUB_PATH} />,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/vishal-r-profile",
    hover: "hover:text-[#0A66C2]",
    mark: <Mark path={LINKEDIN_PATH} />,
  },
  {
    label: "RSS feed",
    href: "/rss.xml",
    hover: "hover:text-[#F26522]",
    // The feed symbol only spans x 4–19.56, y 4.44–20 of its grid.
    mark: <Mark path={RSS_PATH} viewBox="4 4.44 15.56 15.56" />,
  },
  {
    label: "Résumé",
    href: Vishal_Resume,
    hover: "",
    mark: (
      <img
        src="/assets/stickers/resume-sticker-trim.png"
        alt=""
        className={LINK_ART}
      />
    ),
  },
];

/**
 * The site header, on every screen. The sticker and the name lead home.
 *
 * It sits in the same centred column, at the same height, on every screen.
 *
 * `onHome`: on the home screen itself, "home" means closing any open section
 * sheet rather than navigating, so the app hands in its own handler.
 */
const SiteHeader = ({ onHome }: { onHome?: () => void }) => {
  const goHome = onHome
    ? (e: MouseEvent) => {
        e.preventDefault();
        onHome();
      }
    : undefined;

  return (
    <header className="shrink-0 bg-editorial-bg">
      <div className="flex items-center gap-3 md:gap-4 px-6 md:px-12 py-4 md:py-5 max-w-screen-xl mx-auto">
        <Link to="/" onClick={goHome} aria-label="Home" tabIndex={-1} className="shrink-0">
          <img
            src="/assets/stickers/vishal-sticker.png"
            alt=""
            className={`select-none ${STICKER_SIZE} w-auto`}
          />
        </Link>
        <div className="flex flex-col">
          <nav className="flex items-center gap-2 md:gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={`flex items-center ${LINK_SIZE} leading-none text-editorial-text transition-colors ${s.hover}`}
              >
                {s.mark}
              </a>
            ))}
          </nav>
          <Link
            to="/"
            onClick={goHome}
            className="mt-1.5 md:mt-2 self-start font-name font-black text-2xl md:text-3xl leading-none whitespace-nowrap select-none text-editorial-text"
          >
            Vishal R
          </Link>
          {/* A touch smaller and tighter on phones so it fits a 320px screen; the
              line stays 10px tall either way, keeping the sum. */}
          <p className="mt-1 text-[9px] sm:text-[10px] leading-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-editorial-label whitespace-nowrap">
            Full-Stack Developer
          </p>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
