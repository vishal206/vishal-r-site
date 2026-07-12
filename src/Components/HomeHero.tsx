import { Link } from "react-router-dom";
import SocialLinks from "./SocialLinks";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

// The home backdrop that always sits behind the section sheet: just the name
// and the minimal About / Résumé / socials row. Navigation lives in the
// persistent SectionDock at the bottom of the screen.
const HomeHero = () => (
  <div className="absolute inset-0">
    {/* ── Desktop ── */}
    <div className="hidden lg:block">
      <h1
        className="absolute left-1/2 top-[9%] -translate-x-1/2 text-center font-display font-black leading-none whitespace-nowrap select-none"
        style={{ fontSize: "clamp(5rem, 13vw, 12rem)" }}
      >
        Vishal R
      </h1>

      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-editorial-label">
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

    {/* ── Mobile ── */}
    <div className="lg:hidden absolute inset-0 flex flex-col items-center justify-center text-center px-6">
      <h1 className="font-display font-black leading-none text-6xl mb-8">
        Vishal R
      </h1>
      <div className="flex items-center gap-6 text-editorial-label">
        <Link
          to="/about"
          className="text-[10px] uppercase tracking-[0.2em] hover:text-editorial-text"
        >
          About
        </Link>
        <a
          href={Vishal_Resume}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-[0.2em] hover:text-editorial-text"
        >
          Résumé
        </a>
        <SocialLinks />
      </div>
    </div>
  </div>
);

export default HomeHero;
