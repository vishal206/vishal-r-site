import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WeekNoteMeta, loadWeekNoteFile, getAvailableWeekNotes } from "../Utils/markdownLoader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

const WeekNotesBoxSection: React.FC = () => {
  const navigate = useNavigate();
  const [latestWeekNote, setLatestWeekNote] = useState<WeekNoteMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestWeekNote = async () => {
      try {
        const weekNoteSlugs = getAvailableWeekNotes();
        
        if (weekNoteSlugs.length === 0) {
          setLoading(false);
          return;
        }
        
        const weekNotePromises = weekNoteSlugs.map(async (slug) => {
          const weekNote = await loadWeekNoteFile(slug);
          if (!weekNote) return null;
          
          return {
            slug,
            title: weekNote.frontmatter.title,
            date: weekNote.frontmatter.date,
            weeknoteCount: weekNote.frontmatter.weeknoteCount
          };
        });
        
        const fetchedWeekNotes = (await Promise.all(weekNotePromises))
          .filter(weekNote => weekNote !== null) as WeekNoteMeta[];
          
        if (fetchedWeekNotes.length > 0) {
          const sortedWeekNotes = fetchedWeekNotes.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setLatestWeekNote(sortedWeekNotes[0]);
        }
      } catch (err) {
        console.error('Failed to fetch latest week note', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestWeekNote();
  }, []);

  return (
    <div className={`bg-background-secondary rounded-lg py-4 px-4 md:p-6 h-full flex flex-col justify-between`}>
      <div className="md:max-h-96 max-h-78 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : latestWeekNote ? (
          <div 
            onClick={() => navigate(`/weeknote/${latestWeekNote.slug}`)}
            className="cursor-pointer hover:bg-gray-50  rounded transition-colors items-center"
          >
            <div className={`text-text-secondary text-xs md:text-xs font-sans`}>
              Week #{latestWeekNote.weeknoteCount} • {latestWeekNote.date}
            </div>
            <div className="text-base md:text-base font-sans mb-2 hover:underline">
              {latestWeekNote.title}
              <FontAwesomeIcon 
                icon={faExternalLinkAlt} 
                className="text-xs text-black transition-colors flex-shrink-0 ml-1 md:ml-2" 
              />
            </div>
            
            
          </div>
        ) : (
          <div className="text-gray-500 text-center">No week notes available</div>
        )}
      </div>
      <div className="flex flex-row md:flex-row justify-between items-center">
        {/* <div className={`md:text-lg text-sm font-serif text-text-secondary`}>Week Note</div> */}
        <button
          onClick={() => navigate('/?section=weeknotes')}
          className={`text-gray-400 hover:text-gray-600 text-xs md:text-xs font-light border-b border-gray-400 hover:border-gray-600 transition-all md:self-center cursor-pointer pb-0.5 hover:pb-2 hover:font-medium`}
        >
          More
        </button>
      </div>
    </div>
  );
};

export default WeekNotesBoxSection;
