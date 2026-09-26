import { Link, NavLink, Outlet } from "react-router-dom";

const NAV = [
  { label: "Articles", to: "/archive" },
  { label: "Projects", to: "/projects" },
  { label: "About", to: "/about" },
];

// Shared shell for the top-level pages: the name sits top-left with the text
// nav under it, and the routed page renders below. The home route renders
// nothing of its own, so on "/" this shell is the whole page.
const App = () => (
  <div
    className="min-h-screen bg-editorial-bg text-editorial-text font-primary"
    style={{
      backgroundImage:
        "radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.3px)",
      backgroundSize: "24px 24px",
    }}
  >
    <div className="mx-auto w-[715px] pt-4 max-md:w-[90vw] pb-24">
      <header className="pb-10 md:pb-16">
        <Link
          to="/"
          className="font-name font-bold text-lg md:text-xl leading-none whitespace-nowrap text-editorial-text"
        >
          Vishal R
        </Link>
        <nav className="mt-3 flex gap-5">
          {NAV.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `font-name text-sm transition-colors ${
                  isActive
                    ? "text-editorial-text"
                    : "text-editorial-label hover:text-editorial-text"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />
    </div>
  </div>
);

export default App;
