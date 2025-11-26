
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableDevLogProjects, getDevLogsByProject, loadDevLogFile } from "../Utils/markdownLoader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

type DevLogMeta = {
  slug: string;
  title: string;
  date: string;
  project: string;
};

const DevLogBoxSection: React.FC = () => {
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
                project: project // Use folder name instead of frontmatter.project
              });
            }
          }
        }

        // Sort by date (newest first) and take latest 4
        const sortedDevLogs = allDevLogs
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 4);

        setLatestDevLogs(sortedDevLogs);
      } catch (err) {
        console.error('Failed to load devlog entries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestDevLogs();
  }, []);

  return (
    <div className={`bg-background-secondary rounded-lg p-4 md:p-6 h-full`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-base md:text-2xl font-serif text-text-secondary`}>Projects (DevLogs)</h2>
        <button
          onClick={() => navigate('/?section=devlog')}
          className={`text-gray-400 hover:text-gray-600 text-xs md:text-sm font-light border-b border-gray-400 hover:border-gray-600 transition-all self-center cursor-pointer pb-0.5 hover:pb-2 hover:font-medium`}
        >
          Projects
        </button>
      </div>
      <div className="md:max-h-96 max-h-30 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : latestDevLogs.length === 0 ? (
          <div className="text-gray-500 text-center">No dev log entries available</div>
        ) : (
          <div className="space-y-3">
            {latestDevLogs.map((devLog) => (
              <div key={`${devLog.project}-${devLog.slug}`} className="pb-2">
                <div className="group block transition-colors">
                  <div className="flex items-center md:gap-3 gap-1 text-xs md:text-sm font-sans">
                    <span className={`text-text-secondary`}>{devLog.date}</span>
                    <span className="text-gray-400">•</span>
                    <span 
                      onClick={() => navigate(`/?section=devlog&project=${devLog.project}`)}
                      className="text-gray-600 hover:text-gray-800 cursor-pointer hover:underline uppercase text-xs"
                    >
                      {devLog.project}
                    </span>
                  </div>
                  <div 
                    onClick={() => navigate(`/devlog/${devLog.project}/${devLog.slug}`)}
                    className="text-sm md:text-base hover:underline cursor-pointer mt-1"
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

export default DevLogBoxSection;
