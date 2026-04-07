import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BlogReader from "./components/BlogReader.tsx";
import WeekNoteReader from "./components/WeekNoteReader.tsx";
import DevLogReader from "./components/DevLogReader.tsx";
import ArchivePage from "./Pages/ArchivePage.tsx";
import AboutPage from "./Pages/AboutPage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog/:slug" element={<BlogReader />} />
        <Route path="/weeknote/:slug" element={<WeekNoteReader />} />
        <Route path="/devlog/:slug" element={<DevLogReader />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
