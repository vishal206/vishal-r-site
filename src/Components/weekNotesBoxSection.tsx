import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  WeekNoteMeta,
  loadWeekNoteFile,
  getAvailableWeekNotes,
} from "../Utils/markdownLoader";

const WeekNotesBoxSection: React.FC = () => {
  const navigate = useNavigate();
  const [latestWeekNote, setLatestWeekNote] = useState<WeekNoteMeta | null>(
    null
  );
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
            weeknoteCount: weekNote.frontmatter.weeknoteCount,
          };
        });

        const fetchedWeekNotes = (await Promise.all(weekNotePromises)).filter(
          (weekNote) => weekNote !== null
        ) as WeekNoteMeta[];

        if (fetchedWeekNotes.length > 0) {
          const sortedWeekNotes = fetchedWeekNotes.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setLatestWeekNote(sortedWeekNotes[0]);
        }
      } catch (err) {
        console.error("Failed to fetch latest week note", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestWeekNote();
  }, []);

  return (
    <div
      className={`bg-[#F875AA] rounded-xl py-4 px-4 md:p-6 h-full flex flex-col justify-between gap-3`}
    >
      <div className="md:max-h-96 max-h-78 overflow-y-auto h-full">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : latestWeekNote ? (
          <div
            onClick={() => navigate(`/weeknote/${latestWeekNote.slug}`)}
            className="h-full cursor-pointer"
          >
            <div className="h-full font-primary font-black text-white tracking-widest text-xl mb-2 flex items-end">
              {latestWeekNote.title}
              {" >>>>"}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            No week notes available
          </div>
        )}
      </div>
      <div
        className={`font-primary font-black text-primary tracking-widest text-2xl`}
      >
        Week #{latestWeekNote?.weeknoteCount}
      </div>
    </div>
  );
};

export default WeekNotesBoxSection;
