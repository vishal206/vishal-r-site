import { useState, useEffect } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { WeekNote, loadWeekNoteFile } from '../Utils/markdownLoader';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const WeekNoteReader = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [weekNote, setWeekNote] = useState<WeekNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeekNote = async () => {
      try {
        setLoading(true);
        if (!slug) {
          throw new Error('No slug provided');
        }
        
        const loadedWeekNote = await loadWeekNoteFile(slug);
        
        if (!loadedWeekNote) {
          throw new Error('Failed to load week note');
        }
        setWeekNote(loadedWeekNote);
        
        // Track week note views
        logEvent(analytics, 'weeknote_page_view', {
          page_title: loadedWeekNote.frontmatter.title,
          page_location: window.location.href,
          content_type: 'week_note',
          content_id: slug
        });
      } catch (err) {
        setError('Failed to load week note');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekNote();
  }, [slug]);

  const handleBackClick = () => {
    navigate('/?section=weeknotes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-serif">Loading week note...</p>
        </div>
      </div>
    );
  }

  if (error || !weekNote) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleBackClick}
            className="text-blue-600 hover:underline"
          >
            ← Back to Week Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background-secondary py-12 px-4 md:px-0`}>
      
      {/* Breadcrumb navigation */}
      <div className="max-w-3xl mx-auto mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <button 
            onClick={() => navigate('/')}
            className="hover:underline transition-all flex-shrink-0"
          >
            Home
          </button>
          <span className="flex-shrink-0">›</span>
          <button 
            onClick={handleBackClick}
            className="hover:underline transition-all flex-shrink-0"
          >
            Week Notes
          </button>
          <span className="flex-shrink-0">›</span>
          <span className="text-gray-500 truncate min-w-0">{weekNote.frontmatter.title}</span>
        </nav>
      </div>
      
      {/* Content container */}
      <article className="max-w-3xl mx-auto">
        {/* Header section */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-sans font-light leading-tight mb-3">
            {weekNote.frontmatter.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-widest text-gray-500 font-light">
            <time>{weekNote.frontmatter.date}</time>
            <span>•</span>
            <span>Week #{weekNote.frontmatter.weeknoteCount}</span>
          </div>
        </header>
        
        {/* Content section */}
        <div className="prose prose-lg max-w-none font-serif mx-auto">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-serif font-light mt-10 mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-serif font-light mt-8 mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg md:text-xl font-serif font-light mt-6 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="mb-6 leading-relaxed font-light" {...props} />,
              a: (props) => (
                <a {...props} target="_blank" rel="noopener noreferrer" className="text-gray-700 border-b border-gray-300 hover:border-gray-700 transition-colors">
                  {props.children}
                </a>
              ),
              strong: ({node, ...props}) => (
                <strong className="font-bold" {...props} />
              ),
              em: ({node, ...props}) => (
                <em className="italic" {...props} />
              ),
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6" {...props} />,
              li: ({node, ...props}) => <li className="mb-2" {...props} />,
            }}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {weekNote.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
};

export default WeekNoteReader;
