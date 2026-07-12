import { Link } from "react-router-dom";
import SocialLinks from "./SocialLinks";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

const NAV_LINKS = [
  { to: "/movies", label: "Movies" },
  { to: "/books", label: "Books" },
  { to: "/archive", label: "Blog" },
  { to: "/about", label: "About" },
];

const HomeMobile = () => (
  <div className="lg:hidden px-6 py-10 flex flex-col items-center text-center">
    <h1 className="font-display font-black leading-none text-6xl mb-6">
      Vishal R
    </h1>

    <nav className="grid grid-cols-2 gap-3 w-full max-w-xs mt-10">
      {NAV_LINKS.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          className="py-4 rounded-xl border border-editorial-divider text-[11px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors"
        >
          {n.label}
        </Link>
      ))}
    </nav>

    <div className="flex items-center gap-6 mt-8 text-editorial-label">
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
);

export default HomeMobile;
