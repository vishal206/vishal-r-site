import { Outlet } from "react-router-dom";
import Header from "./components/Header";

// Shared shell for the top-level pages: the header, then the routed page. The
// home route renders nothing of its own, so on "/" this shell is the whole page.
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
      <Header />
      <Outlet />
    </div>
  </div>
);

export default App;
