import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectMeta, getAllProjectsMeta } from "../Utils/markdownLoader";

let sharedAudioCtx: AudioContext | null = null;

const playDockTick = () => {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContext();
    }
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

const ProjectIcon = ({ logo, title }: { logo: string; title: string }) => {
  const isImage =
    logo && (logo.startsWith("/") || logo.startsWith("http"));
  return (
    <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-editorial-divider flex items-center justify-center overflow-hidden group-hover:border-available/20 transition-colors shrink-0">
      {isImage ? (
        <img
          src={logo}
          alt={title}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <span className="text-3xl select-none">{logo || "📦"}</span>
      )}
    </div>
  );
};

const ProjectBar = () => {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllProjectsMeta().then(setProjects);
  }, []);

  if (projects.length === 0) return null;

  return (
    <section className="border-t border-editorial-divider py-8">
      <div className="text-[10px] uppercase tracking-[0.22em] text-editorial-label mb-5">
        Projects
      </div>
      <div className="h-px bg-editorial-divider mb-8" />

      <div className="w-full flex justify-center bg-[#161616] border border-editorial-divider rounded-2xl px-8 py-4">
        {projects.map((project) => (
          <button
            key={project.slug}
            onClick={() => navigate(`/projects/${project.slug}`)}
            onMouseEnter={playDockTick}
            className="group flex flex-col items-center gap-2 px-4 transition-transform duration-200 ease-out hover:-translate-y-2 focus:outline-none"
            aria-label={project.title}
          >
            <ProjectIcon logo={project.logo} title={project.title} />
            <span className="text-[9px] uppercase tracking-[0.12em] text-editorial-label group-hover:text-editorial-text transition-colors text-center leading-tight whitespace-nowrap">
              {project.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ProjectBar;
