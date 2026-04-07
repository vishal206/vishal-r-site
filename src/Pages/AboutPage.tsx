import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

// Load all About chapter files eagerly
const aboutFiles = import.meta.glob("/src/Posts/About/*.d", {
  eager: true,
  query: "?raw",
  import: "default",
});

interface Chapter {
  slug: string;
  title: string;
  sno: number;
  content: string;
}

const parseFrontmatter = (raw: string): { data: Record<string, string>; content: string } => {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return { data: {}, content: raw };
  const content = raw.replace(/^---\s*[\s\S]*?\s*---/, "").trim();
  const data: Record<string, string> = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) data[key] = val;
  });
  return { data, content };
};

const getExcerpt = (content: string, maxChars = 300): string => {
  const firstPara = content.split(/\n\n+/)[0] || "";
  const plain = firstPara
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`[^`]+`/g, "")
    .trim();
  return plain.length > maxChars ? plain.slice(0, maxChars).trimEnd() + "…" : plain;
};

const chapters: Chapter[] = Object.entries(aboutFiles)
  .map(([path, raw]) => {
    const slug = path.match(/\/([^/]+)\.d$/)?.[1] ?? path;
    const { data, content } = parseFrontmatter(raw as string);
    return {
      slug,
      title: data.title ?? "Untitled",
      sno: parseInt(data.sno ?? "0", 10),
      content,
    };
  })
  .sort((a, b) => a.sno - b.sno);

// Latest = highest sno
const latestChapter = chapters[chapters.length - 1] ?? null;

const TECH_STACK = [
  "React JS", "TailwindCSS", "Langchain", "OpenAI",
  "Node JS", "Python", "Qlik Sense", "RAG Systems",
  "LLM Orchestration", "Vite", "Firebase",
];

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary">
      <div className="px-6 md:px-12 py-6 max-w-screen-xl mx-auto">

        {/* ── Header ── */}
        <header className="flex items-center justify-between pb-6 border-b border-editorial-divider">
          <Link
            to="/"
            className="text-3xl md:text-5xl font-display font-black text-editorial-text hover:opacity-80 transition-opacity leading-none"
          >
            Vishal R
          </Link>

          <nav className="flex gap-5 md:gap-12 text-[10px] md:text-[11px] uppercase tracking-[0.22em]">
            <button
              onClick={() => navigate("/archive")}
              className="text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
            >
              Blog
            </button>
            <span className="text-editorial-text border-b border-editorial-text pb-0.5">
              About
            </span>
          </nav>

          <div className="text-[10px] uppercase tracking-[0.18em] text-editorial-label text-right hidden md:block">
            Developer. Writer. Builder.
          </div>
        </header>

        {/* ── Narrative Hero — latest chapter ── */}
        {latestChapter && (
          <section className="py-10 md:py-14">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[10px] uppercase tracking-[0.22em] text-available whitespace-nowrap">
                The Narrative
              </span>
              <div className="w-12 h-px bg-editorial-divider shrink-0" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-editorial-label whitespace-nowrap hidden sm:block">
                Chapters of My Life
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-editorial-text leading-[0.95] mb-8 max-w-4xl">
              {latestChapter.title}
            </h1>

            <p className="text-base md:text-lg text-editorial-muted leading-relaxed max-w-2xl">
              {getExcerpt(latestChapter.content)}
            </p>

            <div className="h-px bg-editorial-divider mt-12" />
          </section>
        )}

        {/* ── Three Columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 pb-12">

          {/* 01 / Chapters of Life */}
          <div className="md:border-r border-editorial-divider md:pr-10 py-8 border-b md:border-b-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-6">
              01 / Chapters of Life
            </div>

            {chapters.length === 0 ? (
              <p className="text-sm text-editorial-muted">No chapters yet.</p>
            ) : (
              <div className="space-y-0">
                {chapters.map((ch) => (
                  <div
                    key={ch.slug}
                    className="py-4 border-b border-editorial-divider"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-label mb-1">
                      {String(ch.sno).padStart(2, "0")}
                    </div>
                    <p className="text-base md:text-lg font-display font-bold text-editorial-text leading-tight">
                      {ch.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 02 / Experience */}
          <div className="md:border-r border-editorial-divider md:px-10 py-8 border-b md:border-b-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-6">
              02 / Experience
            </div>

            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-available mb-3">
                Current Experience
              </div>
              <h3 className="text-xl md:text-2xl font-display font-bold text-editorial-text leading-tight mb-2">
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
              <h3 className="text-xl md:text-2xl font-display font-bold text-editorial-text leading-tight mb-2">
                Computer Science and Engineering
              </h3>
              <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-label">
                VIT (Vellore Institute of Technology)
              </div>
            </div>
          </div>

          {/* 03 / Systems */}
          <div className="md:pl-10 py-8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-6">
              03 / Systems
            </div>

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

            <div className="h-px bg-editorial-divider mb-6" />

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.18em]">
                <span className="text-editorial-label">LinkedIn</span>
                <a
                  href="https://linkedin.com/in/vishal-r-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-editorial-text hover:text-editorial-label transition-colors"
                >
                  /in/Vishal-R
                </a>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.18em]">
                <span className="text-editorial-label">Github</span>
                <a
                  href="https://github.com/vishal206"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-editorial-text hover:text-editorial-label transition-colors"
                >
                  /Vishal206
                </a>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.18em]">
                <span className="text-editorial-label">X / Twitter</span>
                <a
                  href="https://x.com/vishal_r_dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-editorial-text hover:text-editorial-label transition-colors"
                >
                  @Vishal_R_Dev
                </a>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.18em]">
                <span className="text-editorial-label">Resume</span>
                <a
                  href={Vishal_Resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-editorial-text hover:text-editorial-label transition-colors"
                >
                  Vishal_Resume.pdf
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="border-t border-editorial-divider py-6 flex justify-end">
          <div className="flex gap-8 text-[10px] uppercase tracking-[0.18em] text-editorial-label">
            <a href="/rss.xml" className="hover:text-editorial-text transition-colors">
              RSS Feed
            </a>
            <Link to="/about" className="hover:text-editorial-text transition-colors">
              Contact
            </Link>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default AboutPage;
