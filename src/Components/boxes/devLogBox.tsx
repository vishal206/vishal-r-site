import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAvailableDevLogProjects,
  getDevLogsByProject,
  loadDevLogFile,
} from "../../Utils/markdownLoader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

type DevLogMeta = {
  slug: string;
  title: string;
  date: string;
  project: string;
};

const DevLogBox: React.FC = () => {
  const navigate = useNavigate();
  const [latestDevLogs, setLatestDevLogs] = useState<DevLogMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestDevLogs = async () => {
      try {
        const projects = getAvailableDevLogProjects();
        const allDevLogs: DevLogMeta[] = [];

        for (const project of projects) {
          const devLogSlugs = getDevLogsByProject(project);

          for (const slug of devLogSlugs) {
            const devLog = await loadDevLogFile(project, slug);
            if (devLog) {
              allDevLogs.push({
                slug,
                title: devLog.frontmatter.title,
                date: devLog.frontmatter.date,
                project: project, // Use folder name instead of frontmatter.project
              });
            }
          }
        }

        // Sort by date (newest first) and take latest 4
        const sortedDevLogs = allDevLogs
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .slice(0, 4);

        setLatestDevLogs(sortedDevLogs);
      } catch (err) {
        console.error("Failed to load devlog entries:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestDevLogs();
  }, []);

  return (
    <div
      className={`bg-secondarybg rounded-3xl p-4 md:p-6 h-full overflow-y-auto`}
    >
      <div className="flex justify-start items-start mb-6">
        <h2
          className={`text-base md:text-base font-primary font-black text-highlight tracking-widest`}
        >
          Projects (DevLogs)
        </h2>
      </div>
      <div className="md:max-h-96 max-h-30 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : latestDevLogs.length === 0 ? (
          <div className="text-gray-500 text-center">
            No dev log entries available
          </div>
        ) : (
          <div className="space-y-3">
            {latestDevLogs.map((devLog) => (
              <div key={`${devLog.project}-${devLog.slug}`} className="pb-2">
                <div className="group block transition-colors">
                  <div className="flex items-center md:gap-3 gap-1 text-xs md:text-xs font-sans">
                    <span
                      onClick={() =>
                        navigate(`/?section=devlog&project=${devLog.project}`)
                      }
                      className="text-gray-600 hover:text-gray-800 cursor-pointer underline uppercase text-xs"
                    >
                      {devLog.project}
                    </span>
                  </div>
                  <div
                    onClick={() =>
                      navigate(`/devlog/${devLog.project}/${devLog.slug}`)
                    }
                    className="text-sm md:text-lg hover:tracking-wider transition-all cursor-pointer mt-1"
                  >
                    {devLog.title}
                    <FontAwesomeIcon
                      icon={faExternalLinkAlt}
                      className="text-xs text-gray-600 transition-colors flex-shrink-0 ml-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevLogBox;
