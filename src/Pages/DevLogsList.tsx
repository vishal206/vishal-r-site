import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableDevLogProjects } from '../Utils/markdownLoader';
import { projectImages, projectDescriptions } from '../Utils/constants';

const DevLogsList: React.FC = () => {
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectNames = getAvailableDevLogProjects();
        
        if (projectNames.length === 0) {
          setError("No devlog projects found");
          setLoading(false);
          return;
        }
        
        setProjects(projectNames);
      } catch (err) {
        setError('Failed to load devlog projects');
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
    <div className="space-y-6">
      {projects.length === 0 ? (
        <div className="text-gray-600 font-sans">
          <p>No devlog projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {projects.map((project) => (
            <div key={project} className="flex flex-col h-full max-w-[250px] mx-auto overflow-hidden duration-300">
              <div 
                onClick={() => navigate(`/?section=devlog&project=${project}`)}
                className="group block transition-all h-full cursor-pointer"
              >
                {/* Square image container */}
                <div className="aspect-square w-full overflow-hidden">
                  {projectImages[project] ? (
                    <img 
                      src={projectImages[project]} 
                      alt={project} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                </div>
                
                {/* Content section */}
                <div className="flex flex-col flex-grow">
                  <h2 className="md:text-xl text-base font-sans transition-colors line-clamp-2 group-hover:underline capitalize mt-2">
                    {project}
                  </h2>
                  {projectDescriptions[project] && (
                    <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                      {projectDescriptions[project]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevLogsList;
