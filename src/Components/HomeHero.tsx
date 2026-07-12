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

const TECH_STACK = [
  "React JS",
  "TailwindCSS",
  "Langchain",
  "OpenAI",
  "Node JS",
  "Python",
  "Qlik Sense",
  "RAG Systems",
  "LLM Orchestration",
  "Vite",
  "Firebase",
];

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
              style={{ transform: "translate(-65%, -50%) rotate(-8deg)" }}
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
              className="pointer-events-none select-none absolute right-[6%] bottom-0 translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 z-10"
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
              {TECH_STACK.map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] uppercase tracking-[0.15em] text-editorial-text border border-editorial-divider px-2 py-1 hover:border-editorial-label transition-colors"
                >
                  {skill}
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
