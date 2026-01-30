import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DevLogMeta,
  getDevLogs,
  loadDevLogFile,
} from "../Utils/markdownLoader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

const DevLogsList: React.FC = () => {
  const [devLogs, setDevlogs] = useState<DevLogMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const allDevLogs: DevLogMeta[] = [];
        const devLogSlugs = getDevLogs();

        if (devLogSlugs.length === 0) {
          setError("No devlogs found");
          setLoading(false);
          return;
        }

        for (const slug of devLogSlugs) {
          const devLog = await loadDevLogFile(slug);
          if (devLog) {
            allDevLogs.push({
              slug,
              title: devLog.frontmatter.title,
              date: devLog.frontmatter.date,
            });
          }
        }

        setDevlogs(allDevLogs);
      } catch (err) {
        setError("Failed to load devlog projects");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="md:space-y-4">
      {devLogs.length === 0 ? (
        <div className="text-gray-600 font-sans">
          <p>No devlogs found.</p>
        </div>
      ) : (
        <div className="">
          {devLogs.map((devLog) => (
            <div key={devLog.slug} className="pb-3 md:pb-1">
              <Link
                to={`/devlog/${devLog.slug}`}
                className="group block md:p-1 rounded transition-colors"
              >
                <div className="flex items-center md:gap-3 gap-1 text-xs md:text-sm font-sans">
                  <span className={`text-secondary`}>{devLog.date}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm md:text-lg group-hover:underline">
                    {devLog.title}
                  </span>
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    className="text-xs text-black transition-colors flex-shrink-0"
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

export default DevLogsList;
