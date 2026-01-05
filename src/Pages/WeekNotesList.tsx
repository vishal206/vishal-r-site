import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  WeekNoteMeta,
  loadWeekNoteFile,
  getAvailableWeekNotes,
} from "../Utils/markdownLoader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

const WeekNotesList = () => {
  const [weekNotes, setWeekNotes] = useState<WeekNoteMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeekNotes = async () => {
      try {
        const weekNoteSlugs = getAvailableWeekNotes();

        if (weekNoteSlugs.length === 0) {
          setError("No week note files found");
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
            weeknoteCount: weekNote.frontmatter.weeknoteCount,
          };
        });

        const fetchedWeekNotes = (await Promise.all(weekNotePromises)).filter(
          (weekNote) => weekNote !== null
        ) as WeekNoteMeta[];

        if (fetchedWeekNotes.length === 0) {
          setError("Could not load any week notes. Check console for details.");
        }

        setWeekNotes(
          fetchedWeekNotes.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      } catch (err) {
        console.error("Failed to fetch week notes", err);
        setError("Failed to fetch week notes");
      } finally {
        setLoading(false);
      }
    };

    fetchWeekNotes();
  }, []);

  if (loading)
    return (
      <div
        className={`flex justify-center items-center h-full text-text-primary`}
      >
        <p className="text-lg font-serif">Loading week notes...</p>
      </div>
    );

  if (error)
    return (
      <div className="text-red-600 font-sans">
        <p>Error: {error}</p>
      </div>
    );

  return (
    <div className="md:space-y-4">
      {weekNotes.length === 0 ? (
        <div className="text-gray-600 font-sans">
          <p>No week notes found.</p>
        </div>
      ) : (
        weekNotes.map((weekNote) => (
          <div key={weekNote.slug} className="pb-3 md:pb-1">
            <Link
              to={`/weeknote/${weekNote.slug}`}
              className="group block md:p-1 rounded transition-colors"
            >
              <div className="flex items-center md:gap-3 gap-1 text-xs md:text-sm font-sans">
                <span className={`text-text-secondary`}>{weekNote.date}</span>
                <span className="text-gray-400">•</span>
                <span className={`text-text-secondary`}>
                  Week #{weekNote.weeknoteCount}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm md:text-lg group-hover:underline">
                  {weekNote.title}
                </span>
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                  className="text-xs text-black transition-colors flex-shrink-0"
                />
              </div>
            </Link>
          </div>
        ))
      )}
    </div>
  );
};

export default WeekNotesList;
