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

// About: where I work, what I studied, and what I build with. Rendered inside
// the App shell, which already provides the page width and the name + nav.
const About = () => (
  <div>
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
                className="peer group relative flex cursor-pointer items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-editorial-text border border-editorial-divider px-2 py-1 origin-center transition-[scale,translate,border-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:z-10 hover:scale-115 hover:[border-color:var(--brand)] peer-hover:translate-x-2 [&:has(~*:hover)]:-translate-x-2"
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
);

export default About;
