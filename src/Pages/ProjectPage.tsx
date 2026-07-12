import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { setExclusionRect } from "../Utils/exclusionZone";
import {
  loadProjectReadme,
  loadProjectPosts,
  ProjectMeta,
  ProjectPost,
} from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "../components/CustomMarkdownReader";
import { usePostEngagement } from "../hooks/usePostEngagement";
import { PostEngagement } from "../components/PostEngagement";
import { useComments } from "../hooks/useComments";
import { PostComments } from "../components/PostComments";

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
  const [overlayOpen, setOverlayOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const engagementSlug = projectSlug ? `project-${projectSlug}` : undefined;
  const engagement = usePostEngagement(engagementSlug);
  const { comments, submitting, submitComment } = useComments(engagementSlug);

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

  // Close overlay on navigation
  useEffect(() => {
    setOverlayOpen(false);
  }, [postSlug]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const update = () => setExclusionRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [loading]);

  useEffect(() => () => setExclusionRect(null), []);

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

      {/* ── Desktop header ── */}
      <div className="hidden md:block shrink-0">
        <SiteHeader />
      </div>

      {/* ── Mobile header — project-specific ── */}
      <header className="md:hidden px-6 py-4 flex items-center justify-between border-b border-editorial-divider shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="text-editorial-label hover:text-editorial-text transition-colors shrink-0"
            aria-label="Back to home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <LogoBox logo={meta.logo} title={meta.title} size="sm" />
          <span className="text-sm font-display font-bold text-editorial-text truncate">
            {meta.title}
          </span>
        </div>

        {posts.length > 0 && (
          <button
            onClick={() => setOverlayOpen(true)}
            className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-editorial-label hover:text-editorial-text transition-colors shrink-0 ml-3"
          >
            Posts
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </header>

      {/* ── Mobile fullscreen overlay ── */}
      {overlayOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-editorial-bg flex flex-col">
          {/* Overlay header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-editorial-divider">
            <div className="flex items-center gap-3">
              <LogoBox logo={meta.logo} title={meta.title} size="sm" />
              <span className="text-sm font-display font-bold text-editorial-text">
                {meta.title}
              </span>
            </div>
            <button
              onClick={() => setOverlayOpen(false)}
              className="text-editorial-label hover:text-editorial-text transition-colors"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Overlay nav list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Overview */}
            <div
              className={`py-4 border-b border-editorial-divider transition-opacity ${!postSlug ? "opacity-100" : "opacity-50"}`}
            >
              <button
                onClick={() => navigate(`/projects/${projectSlug}`)}
                className="block w-full text-left"
              >
                <div className="text-[9px] uppercase tracking-[0.2em] text-editorial-label mb-1">Overview</div>
                <p className="text-base font-display font-bold text-editorial-text">README</p>
              </button>
            </div>

            {/* Posts */}
            {posts.map((post) => {
              const isActive = post.slug === postSlug;
              return (
                <div
                  key={post.slug}
                  className={`py-4 border-b border-editorial-divider last:border-0 transition-opacity ${isActive ? "opacity-100" : "opacity-50"}`}
                >
                  <Link
                    to={`/projects/${projectSlug}/${post.slug}`}
                    className="block"
                  >
                    {isActive && (
                      <div className="text-[9px] uppercase tracking-[0.18em] text-available mb-1">
                        Reading
                      </div>
                    )}
                    <p className="text-base font-display font-bold text-editorial-text leading-snug">
                      {post.title}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar (desktop only) ── */}
        <aside className="hidden md:flex w-60 shrink-0 border-r border-editorial-divider flex-col overflow-y-auto">
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
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* ── Right content ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="px-6 md:px-12 pt-10 pb-20 max-w-3xl">
            <div className="mb-8 pb-8 border-b border-editorial-divider">
              <div className="flex items-center gap-5">
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
              {!postSlug && (
                <PostEngagement
                  {...engagement}
                  commentCount={comments.length}
                  variant="compact"
                />
              )}
            </div>

            <CustomMarkdownReader content={displayContent} />

            {!postSlug && (
              <>
                <PostEngagement
                  {...engagement}
                  commentCount={comments.length}
                  variant="full"
                />
                <PostComments
                  comments={comments}
                  submitting={submitting}
                  onSubmit={submitComment}
                />
              </>
            )}
          </div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default ProjectPage;
