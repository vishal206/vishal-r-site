import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  loadProjectReadme,
  loadProjectPosts,
  ProjectMeta,
  ProjectPost,
} from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "../components/CustomMarkdownReader";

const LogoBox = ({
  logo,
  title,
  size = "md",
}: {
  logo: string;
  title: string;
  size?: "sm" | "md" | "lg";
}) => {
  const isImage = logo && (logo.startsWith("/") || logo.startsWith("http"));
  const sizeClasses = {
    sm: "w-9 h-9 rounded-xl text-lg",
    md: "w-12 h-12 rounded-xl text-2xl",
    lg: "w-16 h-16 rounded-2xl text-3xl",
  }[size];
  return (
    <div
      className={`${sizeClasses} bg-[#1e1e1e] border border-editorial-divider flex items-center justify-center overflow-hidden shrink-0`}
    >
      {isImage ? (
        <img src={logo} alt={title} className="w-full h-full object-cover" />
      ) : (
        <span className="select-none">{logo || "📦"}</span>
      )}
    </div>
  );
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.toUpperCase();
    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return dateStr.toUpperCase();
  }
};

const ProjectPage = () => {
  const { projectSlug, postSlug } = useParams<{
    projectSlug: string;
    postSlug?: string;
  }>();
  const navigate = useNavigate();

  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectSlug) return;
    setLoading(true);
    Promise.all([
      loadProjectReadme(projectSlug),
      loadProjectPosts(projectSlug),
    ]).then(([readme, projectPosts]) => {
      if (readme) {
        setMeta(readme.frontmatter);
        setReadmeContent(readme.content);
      }
      setPosts(projectPosts);
      setLoading(false);
    });
  }, [projectSlug]);

  if (loading)
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <p className="text-editorial-label text-[11px] uppercase tracking-widest">
          Loading…
        </p>
      </div>
    );

  if (!meta)
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <p className="text-editorial-label text-sm">Project not found</p>
      </div>
    );

  const activePost = postSlug
    ? (posts.find((p) => p.slug === postSlug) ?? null)
    : null;
  const displayContent = activePost ? activePost.content : readmeContent;
  const displayTitle = activePost ? activePost.title : meta.title;

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-primary flex flex-col">
      {/* ── Header ── */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-editorial-divider shrink-0">
        <Link
          to="/"
          className="text-xl md:text-2xl font-display font-black text-editorial-text hover:opacity-80 transition-opacity leading-none"
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
          <button
            onClick={() => navigate("/about")}
            className="text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
          >
            About
          </button>
        </nav>
        <div className="text-[10px] uppercase tracking-[0.18em] text-editorial-label text-right hidden md:block">
          Developer. Writer. Builder.
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ── */}
        <aside className="hidden md:flex w-60 shrink-0 border-r border-editorial-divider flex-col overflow-y-auto">
          {/* Project identity */}
          <div className="p-6 border-b border-editorial-divider">
            <button
              onClick={() => navigate("/")}
              className="text-[9px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors block mb-5 text-left"
            >
              ← Home
            </button>
            <div className="flex items-center gap-3">
              <LogoBox logo={meta.logo} title={meta.title} size="sm" />
              <h2 className="text-sm font-display font-bold text-editorial-text leading-tight">
                {meta.title}
              </h2>
            </div>
          </div>

          {/* Overview link */}
          <div className="px-6 pt-5">
            <button
              onClick={() => navigate(`/projects/${projectSlug}`)}
              className={`block w-full text-left py-2 text-[9px] uppercase cursor-pointer tracking-[0.2em] transition-opacity ${
                !postSlug
                  ? "text-editorial-text opacity-100"
                  : "text-editorial-label opacity-50 hover:opacity-100"
              }`}
            >
              Overview
            </button>
          </div>

          {/* Posts list */}
          {posts.length > 0 && (
            <div className="px-6 pt-5 pb-8">
              <div className="text-[9px] uppercase tracking-[0.2em] text-editorial-label mb-3">
                Posts
              </div>
              <div className="h-px bg-editorial-divider mb-1" />
              {posts.map((post) => {
                const isActive = post.slug === postSlug;
                return (
                  <div
                    key={post.slug}
                    className={`py-4 border-b border-editorial-divider last:border-0 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Link
                      to={`/projects/${projectSlug}/${post.slug}`}
                      className="block group"
                    >
                      {isActive && (
                        <div className="text-[9px] uppercase tracking-[0.18em] text-available mb-1">
                          Reading
                        </div>
                      )}
                      <p className="text-sm font-display font-bold text-editorial-text leading-tight group-hover:opacity-70 transition-opacity line-clamp-2">
                        {post.title}
                      </p>
                      {post.date && (
                        <p className="text-[9px] uppercase tracking-[0.15em] text-editorial-label mt-1">
                          {formatDate(post.date)}
                        </p>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* ── Right content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 md:px-12 pt-10 pb-20 max-w-3xl">
            {/* Content header */}
            <div className="flex items-center gap-5 mb-8 pb-8 border-b border-editorial-divider">
              <LogoBox logo={meta.logo} title={meta.title} size="lg" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-available mb-1">
                  {meta.title}
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-black text-editorial-text leading-tight">
                  {displayTitle}
                </h1>
              </div>
            </div>

            <CustomMarkdownReader content={displayContent} />

            <div className="mt-10 pt-8 border-t border-editorial-divider">
              <button
                onClick={() => navigate(-1)}
                className="text-[10px] uppercase tracking-[0.22em] text-editorial-label hover:text-editorial-text transition-colors cursor-pointer"
              >
                ← Back
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectPage;
