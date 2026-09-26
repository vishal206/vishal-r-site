import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectMeta, getAllProjectsMeta } from "../Utils/markdownLoader";

// Die-cut sticker chrome for the project logos: thick white edge + lift shadow.
const STICKER =
  "border-[3px] border-white bg-editorial-bg shadow-[0_12px_28px_-8px_rgba(0,0,0,0.8)]";

const isImageLogo = (logo: string) =>
  !!logo && (logo.startsWith("/") || logo.startsWith("http"));

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  useEffect(() => {
    getAllProjectsMeta().then(setProjects);
  }, []);

  return (
    <div className="pb-10">
      {projects.length === 0 ? (
        <div className="text-center text-editorial-label text-sm py-16">
          No projects yet.
        </div>
      ) : (
        <div className="flex flex-wrap gap-10 md:gap-14">
          {projects.map((p) => (
            <button
              key={p.slug}
              onClick={() => navigate(`/projects/${p.slug}`)}
              className="group flex flex-col items-center gap-3 w-36 text-center cursor-pointer"
            >
              <div
                className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center bg-white transition-transform duration-300 group-hover:-translate-y-1 ${STICKER}`}
              >
                {isImageLogo(p.logo) ? (
                  <img
                    src={p.logo}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl select-none">{p.logo || "📦"}</span>
                )}
              </div>
              <p className="text-[13px] font-display font-bold leading-snug text-editorial-text line-clamp-2">
                {p.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
