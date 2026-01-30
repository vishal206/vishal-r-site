import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DevLogMeta,
  getDevLogs,
  loadDevLogFile,
} from "../../Utils/markdownLoader";

const DevLogBox: React.FC = () => {
  const navigate = useNavigate();
  const [latestDevLogs, setLatestDevLogs] = useState<DevLogMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestDevLogs = async () => {
      try {
        const allDevLogs: DevLogMeta[] = [];

        const devLogSlugs = getDevLogs();

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
          <div className="space-y-2">
            {latestDevLogs.map((devLog) => (
              <div key={`${devLog.slug}`}>
                <div className="group block transition-colors">
                  <div
                    onClick={() => navigate(`/devlog/${devLog.slug}`)}
                    className="text-sm md:text-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-baseline hover:underline">
                      <div>{devLog.title}</div>
                    </div>
                    <div className="text-xs font-light">{devLog.date}</div>
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
