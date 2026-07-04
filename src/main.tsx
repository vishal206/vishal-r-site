import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import BlogReader from "./components/BlogReader.tsx";
import ArchivePage from "./Pages/ArchivePage.tsx";
import BooksPage from "./Pages/BooksPage.tsx";
import BookPage from "./Pages/BookPage.tsx";
import AboutPage from "./Pages/AboutPage.tsx";
import ProjectPage from "./Pages/ProjectPage.tsx";
import { analytics } from "./firebase.ts";
import { logEvent } from "firebase/analytics";

function PageViewTracker() {
  const location = useLocation();
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return; // Firebase auto-fires page_view on initial load
    }
    if (analytics) {
      logEvent(analytics, "page_view", {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
      });
    }
  }, [location]);
  return null;
}

const container = document.getElementById("root")!;

const tree = (
  <StrictMode>
    <BrowserRouter>
      <PageViewTracker />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/archive/:slug" element={<BlogReader />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/book/:slug" element={<BookPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects/:projectSlug" element={<ProjectPage />} />
        <Route
          path="/projects/:projectSlug/:postSlug"
          element={<ProjectPage />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

// Paths the SPA knows how to render. Used to avoid wiping prerendered content in
// reader/extracted contexts (see below).
const KNOWN_ROUTE =
  /^\/(?:archive(?:\/[^/]+)?|books|book\/[^/]+|about|projects\/[^/]+(?:\/[^/]+)?)?\/?$/;

// Prerendered pages already contain the article markup, which the browser paints
// before this script runs (great for perceived speed, SEO and RSS readers). We
// mount with createRoot rather than hydrateRoot: the prerendered HTML is a DOM
// snapshot, not renderToString output, so it lacks hydration boundary markers.
// Content pages (BlogReader, ArchivePage) render synchronously and identically,
// so React's first commit matches the painted pixels — no flash, no warnings.
//
// Guard: some RSS readers (e.g. FeedFlow) load our prerendered HTML into a webview
// whose URL is NOT the article's route (often about:blank). If we mounted there,
// React Router would match no route, render nothing, and createRoot would wipe the
// prerendered article to a blank screen. So when the page was prerendered AND the
// current path isn't a real app route, leave the static content untouched.
const isPrerendered = container.hasChildNodes();
if (isPrerendered && !KNOWN_ROUTE.test(window.location.pathname)) {
  // Reader/extracted context — keep the static prerendered article as-is.
} else {
  createRoot(container).render(tree);
}
