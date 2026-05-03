import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import BlogReader from "./components/BlogReader.tsx";
import ArchivePage from "./Pages/ArchivePage.tsx";
import AboutPage from "./Pages/AboutPage.tsx";
import CursorCar from "./components/CursorCar.tsx";
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
    logEvent(analytics, "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
    });
  }, [location]);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PageViewTracker />
      <CursorCar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/archive/:slug" element={<BlogReader />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
