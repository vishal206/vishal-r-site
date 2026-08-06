import { faAws } from "@fortawesome/free-brands-svg-icons";
import {
  siDocker,
  siFastapi,
  siLanggraph,
  siNextdotjs,
  siPostgresql,
  siPython,
  siReact,
  siTypescript,
} from "simple-icons";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/vishal-r-profile",
    img: "/assets/stickers/linkedin-sticker.png",
  },
  {
    label: "GitHub",
    href: "https://github.com/vishal206",
    img: "/assets/stickers/github-sticker.png",
  },
  {
    label: "Résumé",
    href: Vishal_Resume,
    img: "/assets/stickers/resume-sticker-trim.png",
  },
] as {
  label: string;
  href: string;
  img?: string;
  color?: string;
  viewBox?: string;
  path?: string;
}[];

// Logos are raw path data so they can inherit currentColor: the chips read as
// monochrome type until hovered, when the brand colour comes through. Most come
// from simple-icons (24×24 viewBox); AWS is the exception — Amazon pulled its
// marks from that set, so we fall back to Font Awesome's brand icon.
const TECH_STACK = [
  { label: "React JS", icon: siReact },
  { label: "TypeScript", icon: siTypescript },
  // simple-icons ships Next.js as pure black, which vanishes on our dark sheet.
  { label: "Next.JS", icon: { ...siNextdotjs, hex: "FFFFFF" } },
  { label: "Python", icon: siPython },
  { label: "FastAPI", icon: siFastapi },
  { label: "LangGraph", icon: siLanggraph },
  { label: "PostgreSQL", icon: siPostgresql },
  { label: "Docker", icon: siDocker },
  {
    label: "AWS",
    icon: {
      path: faAws.icon[4] as string,
      hex: "FF9900",
      viewBox: `0 0 ${faAws.icon[0]} ${faAws.icon[1]}`,
    },
  },
] as {
  label: string;
  icon: { path: string; hex: string; viewBox?: string };
}[];

// The home backdrop that always sits behind the section sheet. It now carries
// the full "about" narrative — the name hero, the latest chapter, and the
// three-column dossier — in its own scroll container. Navigation still lives in
// the persistent SectionDock at the bottom of the screen, so we pad the bottom
// to keep content clear of the dock.
const HomeHero = () => (
  <div className="absolute inset-0 overflow-y-auto">
    <div className="px-6 md:px-12 pb-[14rem] max-w-screen-xl mx-auto">
      {/* ── Name hero ── */}
      <div className="pt-20 pb-10 md:pt-16 md:pb-16 lg:pt-[8vh] lg:pb-28">
        <div className="relative flex justify-center">
          <h1
            className="relative inline-block font-name font-black leading-none whitespace-nowrap select-none"
            style={{ fontSize: "clamp(3.5rem, 13vw, 12rem)" }}
          >
            {/* Sticker slapped to the left, overlapping the "V" */}
            <img
              src="/assets/stickers/vishal-sticker.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none absolute left-0 top-1/2 w-[0.9em] h-auto"
              style={{ transform: "translate(-65%, -50%) rotate(-2deg)" }}
            />
            {/* Social icons — slapped on top of the title, between "h" and "l" */}
            <div className="absolute left-[58%] top-0 -translate-x-1/2 -translate-y-1/2 flex gap-2.5 z-10">
              {SOCIALS.map((s, i) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{ transform: `rotate(${(i - 1) * 8}deg)` }}
                  className="transition-transform hover:scale-110 hover:!rotate-0"
                >
                  {s.img ? (
                    <img
                      src={s.img}
                      alt={s.label}
                      className={`object-contain select-none ${
                        s.label === "Résumé"
                          ? "h-7 sm:h-9 lg:h-11 w-auto"
                          : "w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10"
                      }`}
                    />
                  ) : (
                    <span className="flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white bg-editorial-bg shadow-[0_6px_16px_-4px_rgba(0,0,0,0.8)]">
                      <svg
                        width="15"
                        height="15"
                        viewBox={s.viewBox}
                        fill={s.color}
                        aria-hidden="true"
                      >
                        <path d={s.path} />
                      </svg>
                    </span>
                  )}
                </a>
              ))}
            </div>
            {/* "I'm a full stack developer" sticker — slapped on the title's bottom-right */}
            <img
              src="/assets/stickers/im-full-stack-developer-trim.png"
              alt="I'm a full stack developer"
              className="pointer-events-none select-none absolute right-[2%] bottom-0 w-20 sm:w-28 md:w-36 lg:w-44 z-10"
              style={{ transform: "translateY(70%) rotate(-6deg)" }}
            />
            Vishal R
          </h1>
        </div>
      </div>

      {/* ── Two Columns ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Experience */}
        <div className="md:border-r border-editorial-divider md:pr-10 py-8 border-b md:border-b-0">
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-available mb-3">
              Current Experience
            </div>
            <h3 className="text-sm md:text-base font-display font-bold text-editorial-text leading-tight mb-1.5">
              Business Intelligence &amp; Analytics Engineer
            </h3>
            <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-label">
              @ Condé Nast
            </div>
          </div>

          <div className="h-px bg-editorial-divider my-6" />

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-available mb-3">
              Academic Background
            </div>
            <h3 className="text-sm md:text-base font-display font-bold text-editorial-text leading-tight mb-1.5">
              Computer Science and Engineering
            </h3>
            <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-label">
              VIT (Vellore Institute of Technology)
            </div>
          </div>
        </div>

        {/* Systems */}
        <div className="md:pl-10 py-8">
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-label mb-4">
              Skills / Tech Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {TECH_STACK.map(({ label, icon }) => (
                <span
                  key={label}
                  style={{ "--brand": `#${icon.hex}` } as React.CSSProperties}
                  className="group relative flex cursor-pointer items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-editorial-text border border-editorial-divider px-2 py-1 origin-center transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:z-10 hover:scale-115 hover:[border-color:var(--brand)]"
                >
                  <svg
                    viewBox={icon.viewBox ?? "0 0 24 24"}
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 text-editorial-label transition-colors duration-300 group-hover:[color:var(--brand)]"
                  >
                    <path d={icon.path} />
                  </svg>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default HomeHero;
