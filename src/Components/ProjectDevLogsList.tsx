import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { getDevLogsByProject, loadDevLogFile } from "../Utils/markdownLoader";

type DevLogMeta = {
  slug: string;
  title: string;
  date: string;
  project: string;
};

const ProjectDevLogsList: React.FC<{ project: string }> = ({ project }) => {
  const [devLogs, setDevLogs] = useState<DevLogMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevLogs = async () => {
      try {
        const devLogSlugs = getDevLogsByProject(project);

        if (devLogSlugs.length === 0) {
          setError(`No devlogs found for project: ${project}`);
          setLoading(false);
          return;
        }

        const devLogPromises = devLogSlugs.map(async (slug) => {
          const devLog = await loadDevLogFile(project, slug);
          if (!devLog) return null;

          return {
            slug,
            title: devLog.frontmatter.title,
            date: devLog.frontmatter.date,
            project: devLog.frontmatter.project,
          };
        });

        const fetchedDevLogs = (await Promise.all(devLogPromises)).filter(
          (devLog) => devLog !== null,
        ) as DevLogMeta[];

        // Sort by date (newest first)
        fetchedDevLogs.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setDevLogs(fetchedDevLogs);
      } catch (err) {
        setError(`Failed to load devlogs for project: ${project}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevLogs();
  }, [project]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading devlogs...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {devLogs.length === 0 ? (
        <div className="text-gray-600 font-sans">
          <p>No devlogs found for this project.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devLogs.map((devLog) => (
            <div key={devLog.slug} className="pb-2">
              <Link
                to={`/devlog/${project}/${devLog.slug}`}
                className="group block md:p-2 rounded transition-colors"
              >
                <div className="flex items-center md:gap-3 gap-1 text-xs md:text-sm font-sans">
                  <span className={`text-secondary`}>{devLog.date}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm md:text-lg group-hover:underline">
                    {devLog.title}
                  </span>
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    className="text-xs text-gray-600 transition-colors flex-shrink-0"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDevLogsList;
