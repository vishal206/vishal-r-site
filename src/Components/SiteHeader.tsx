import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

// The header block: the Vishal sticker beside a stack of the links, the name
// and a tagline, the sticker exactly as tall as that stack. Heights are
// spelled out so they add up: links 18 + gap 6 + name 24 + gap 4 + tagline 10
// = 62 (phones), and 22 + 8 + 30 + 4 + 10 = 74 from md.
const LINK_SIZE = "text-lg md:text-[22px]";
const LINK_ART = "h-[18px] md:h-[22px] w-auto select-none";
const STICKER_SIZE = "h-[62px] md:h-[74px]";

// The official marks, in the name's colour until hovered, when each takes its
// brand colour. LinkedIn is its "in" set in a disc (to sit round beside
// GitHub's round mark). GitHub's brand colour is near-black, invisible on this
// background, so it brightens to white — how GitHub shows its mark on dark.
const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/vishal-r-profile",
    hover: "hover:text-[#0A66C2]",
    mark: (
      <span className="flex items-center justify-center w-[1em] h-[1em] rounded-full bg-current transition-colors">
        <FontAwesomeIcon icon={faLinkedinIn} className="text-[0.55em] text-editorial-bg" />
      </span>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/vishal206",
    hover: "hover:text-white",
    mark: <FontAwesomeIcon icon={faGithub} />,
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
