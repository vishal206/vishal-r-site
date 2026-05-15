import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectMeta, getAllProjectsMeta } from "../Utils/markdownLoader";
import { useProjectStats } from "../hooks/useProjectStats";

let sharedAudioCtx: AudioContext | null = null;

const playTick = () => {
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
    const ctx = sharedAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    // AudioContext not available
  }
};

const TILTS = [-6, 4, -3, 7, -5, 2, -8, 5];

type PolaroidProps = {
  project: ProjectMeta;
  tilt: number;
  lifted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const Polaroid = ({ project, tilt, lifted, onClick, onMouseEnter, onMouseLeave }: PolaroidProps) => {
  const isImage =
    project.logo &&
    (project.logo.startsWith("/") || project.logo.startsWith("http"));
  const stats = useProjectStats(project.slug);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        transform: lifted
          ? "rotate(0deg) translateY(-20px) scale(1.07)"
          : `rotate(${tilt}deg)`,
        transition: "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: lifted ? 10 : 1,
        scrollSnapAlign: "center",
      }}
      className="relative cursor-pointer shrink-0"
    >
      {/* Shadow */}
      <div
        className="absolute inset-0 rounded-sm pointer-events-none"
        style={{
          boxShadow: lifted
            ? "0 24px 48px rgba(0,0,0,0.7), 0 8px 16px rgba(0,0,0,0.5)"
            : "0 8px 24px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)",
          transition: "box-shadow 0.28s ease",
        }}
      />

      {/* Polaroid frame */}
      <div className="relative w-32 md:w-40 bg-[#f0ece4] p-2 md:p-2.5 pb-0">
        {/* Photo */}
        <div className="w-full aspect-square bg-[#111] flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img
              src={project.logo}
              alt={project.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="text-4xl md:text-5xl select-none">
              {project.logo || "📦"}
            </span>
          )}
        </div>

        {/* Caption */}
        <div className="py-2 md:py-3 px-1 min-h-[56px] md:min-h-[64px]">
          <p
            className="text-[13px] md:text-[15px] font-semibold text-[#1a1a1a] leading-tight mb-0.5"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            {project.title}
          </p>
          {project.description && (
            <p
              className="text-[10px] md:text-[11px] text-[#666] leading-snug line-clamp-2"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              {project.description}
            </p>
          )}
          {stats && (stats.viewCount > 0 || stats.likeCount > 0 || stats.commentCount > 0) && (
            <div className="flex items-center gap-2 mt-1.5" style={{ fontFamily: "'Caveat', cursive" }}>
              {stats.viewCount > 0 && (
                <span className="text-[10px] text-[#888]">👁 {stats.viewCount}</span>
              )}
              {stats.likeCount > 0 && (
                <span className="text-[10px] text-[#888]">♥ {stats.likeCount}</span>
              )}
              {stats.commentCount > 0 && (
                <span className="text-[10px] text-[#888]">💬 {stats.commentCount}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile selected dot */}
      {lifted && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-available" />
      )}
    </div>
  );
};

const ProjectBar = () => {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTickedIdx = useRef(-1);

  useEffect(() => {
    // Always default to first project — no featured logic
    getAllProjectsMeta().then(setProjects);
  }, []);

  // Center-padding on mobile so first and last cards can reach center
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const update = () => {
      if (window.innerWidth < 768) {
        const pad = `${container.offsetWidth / 2 - 64}px`;
        container.style.paddingLeft = pad;
        container.style.paddingRight = pad;
      } else {
        container.style.paddingLeft = "";
        container.style.paddingRight = "";
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [projects]);

  // Scroll-driven focus on mobile
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let rafId: number;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const center = container.scrollLeft + container.offsetWidth / 2;
        let closestIdx = 0;
        let closestDist = Infinity;
        Array.from(container.children).forEach((el, i) => {
          const child = el as HTMLElement;
          const cardCenter = child.offsetLeft + child.offsetWidth / 2;
          const dist = Math.abs(cardCenter - center);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        });
        setSelectedIdx((prev) => {
          if (prev !== closestIdx) {
            if (lastTickedIdx.current !== closestIdx) {
              lastTickedIdx.current = closestIdx;
              playTick();
            }
            return closestIdx;
          }
          return prev;
        });
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [projects]);

  if (projects.length === 0) return null;

  return (
    <section className="border-t border-editorial-divider py-8">
      <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-5">
        02 / Projects
      </div>
      <div className="h-px bg-editorial-divider mb-12" />

      <div
        ref={scrollRef}
        className="flex items-end gap-5 md:gap-10 md:flex-wrap md:justify-center pt-8 pb-8 md:pb-6 md:px-0 overflow-x-auto md:overflow-visible"
        style={{
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {projects.map((project, i) => {
          // On desktop: hovered card wins; fall back to selected when nothing hovered
          // On mobile: selected (scroll-driven) always wins
          const lifted =
            hoveredIdx !== null ? hoveredIdx === i : selectedIdx === i;

          return (
            <Polaroid
              key={project.slug}
              project={project}
              tilt={TILTS[i % TILTS.length]}
              lifted={lifted}
              onClick={() => navigate(`/projects/${project.slug}`)}
              onMouseEnter={() => {
                if (hoveredIdx !== i) playTick();
                setHoveredIdx(i);
              }}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ProjectBar;
