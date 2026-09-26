import { Link } from "react-router-dom";
import Navigation from "./Navigation";

// Site header: the name top-left, with the navigation row under it.
const Header = () => (
  <header className="pb-10 md:pb-16">
    <div className="flex items-baseline gap-[1rem]">
      <Link
        to="/"
        className="font-name font-bold text-[32px] leading-none whitespace-nowrap text-editorial-text"
      >
        vishal.r
      </Link>
      {/* Same type as the (inactive) navigation items */}
      <span className="font-name text-base text-editorial-label whitespace-nowrap">
        fullstack developer
      </span>
    </div>
    <div className="mt-3">
      <Navigation />
    </div>
  </header>
);

export default Header;
