import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReaderShell, { LogoBox } from "../components/ReaderShell";
import {
  loadProjectReadme,
  loadProjectPosts,
  ProjectMeta,
  ProjectPost,
} from "../Utils/markdownLoader";
import { CustomMarkdownReader } from "../components/CustomMarkdownReader";
import ContextToc, { extractHeadings } from "../components/ContextToc";
import { usePostEngagement } from "../hooks/usePostEngagement";
import { PostEngagement } from "../components/PostEngagement";
import { useComments } from "../hooks/useComments";
import { PostComments } from "../components/PostComments";

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

  // ── Right rail: on-this-page TOC for posts (or the overview) flagged
  // isContextTable. Frontmatter booleans can arrive as `true` or "true".
  const ctxSource = activePost ?? meta;
  const showToc =
    (ctxSource?.isContextTable === true ||
      ctxSource?.isContextTable === "true") &&
    extractHeadings(displayContent).length > 0;
  const rightRail = showToc ? <ContextToc content={displayContent} /> : undefined;

  const preNav = (
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
  );

  const nav =
    posts.length > 0 &&
    posts.map((post) => {
      const isActive = post.slug === postSlug;
      return (
        <div
          key={post.slug}
          className={`py-4 border-b border-editorial-divider last:border-0 transition-opacity ${
            isActive ? "opacity-100" : "opacity-50 hover:opacity-100"
          }`}
        >
          <Link to={`/projects/${projectSlug}/${post.slug}`} className="block group">
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
    });

  return (
    <ReaderShell
      brandLogo={meta.logo}
      brandTitle={meta.title}
      navLabel="Posts"
      backTo="/projects"
      backLabel="Projects"
      preNav={preNav}
      nav={nav || undefined}
      rightRail={rightRail}
    >
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
    </ReaderShell>
  );
};

export default ProjectPage;
