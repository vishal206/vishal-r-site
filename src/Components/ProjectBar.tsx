import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectMeta, getAllProjectsMeta } from "../Utils/markdownLoader";

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

      <div className="w-full flex justify-center">
        <div className="flex items-end gap-2 px-5 py-4 bg-[#161616] border border-editorial-divider rounded-2xl">
          {projects.map((project) => (
            <button
              key={project.slug}
              onClick={() => navigate(`/projects/${project.slug}`)}
              className="group relative flex flex-col items-center gap-2 px-2 transition-transform duration-200 ease-out hover:-translate-y-2 focus:outline-none"
              aria-label={project.title}
            >
              {/* Tooltip on hover */}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#2a2a2a] border border-editorial-divider text-editorial-text text-[9px] uppercase tracking-[0.15em] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                {project.title}
              </span>
              <ProjectIcon logo={project.logo} title={project.title} />
              <span className="text-[9px] uppercase tracking-[0.12em] text-editorial-label group-hover:text-editorial-text transition-colors w-[72px] text-center leading-tight truncate">
                {project.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectBar;
