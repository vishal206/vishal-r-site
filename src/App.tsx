import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";
import BannerSection from "./Components/bannerSection";
import IntroSection from "./Components/introSection";
import BlogsBoxSection from "./Components/blogsBoxSection";
import { banners } from "./Utils/constants";
import AboutSection from "./Components/aboutSection";
import BlogList from "./Pages/BlogList";
import WeekNotesBoxSection from "./Components/weekNotesBoxSection";
import WeekNotesList from "./Pages/WeekNotesList";
import DevLogsList from "./Pages/DevLogsList";
import DevLogBoxSection from "./Components/devLogBoxSection";
import ProjectDevLogsList from "./Components/ProjectDevLogsList";

const App = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (section) {
      setActiveSection(section);
      // Track section views
      logEvent(analytics, "page_view", {
        page_title: `${section} Section`,
        page_location: window.location.href,
      });
    }
  }, [location]);

  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    navigate(`/?section=${section}`, { replace: false });

    // Track section clicks
    logEvent(analytics, "select_content", {
      content_type: "section",
      content_id: section,
    });
  };

  const closeSectionView = () => {
    setActiveSection(null);
    navigate("/", { replace: true });
  };

  if (activeSection === "about") {
    return <AboutSection onClose={closeSectionView} />;
  }

  if (activeSection === "blog") {
    return (
      <div className={`min-h-screen bg-background-secondary p-4 md:p-6 pb-8`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="mb-6">
            <button
              onClick={closeSectionView}
              className="text-text-secondary text-sm font-light border-b border-text-secondary transition-all cursor-pointer pb-0.5 hover:font-medium"
            >
              ← Back to Home
            </button>
          </div>
          <div className={`h-[calc(100vh-8rem)]`}>
            <h1
              className={`text-xl md:text-2xl font-serif text-text-secondary mb-6`}
            >
              All Blogs
            </h1>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <BlogList />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === "weeknotes") {
    return (
      <div className={`min-h-screen bg-background-secondary p-4 md:p-6 pb-8`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="mb-6">
            <button
              onClick={closeSectionView}
              className="text-text-secondary text-sm font-light border-b border-text-secondary transition-all cursor-pointer pb-0.5 hover:font-medium"
            >
              ← Back to Home
            </button>
          </div>
          <div className={`h-[calc(100vh-8rem)]`}>
            <h1
              className={`md:text-2xl text-xl font-serif text-text-secondary mb-6`}
            >
              Week Notes
            </h1>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <WeekNotesList />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === "devlog") {
    const params = new URLSearchParams(location.search);
    const selectedProject = params.get("project");

    return (
      <div className={`min-h-screen bg-mainbg p-4 md:p-6 pb-8`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="mb-6">
            <button
              onClick={closeSectionView}
              className="text-text-secondary text-sm font-light border-b border-text-secondary transition-all cursor-pointer pb-0.5 hover:font-medium"
            >
              ← Back to Home
            </button>
          </div>
          <div className={`h-[calc(100vh-8rem)]`}>
            <h1
              className={`text-xl md:text-2xl font-serif text-text-secondary mb-6`}
            >
              {selectedProject ? `${selectedProject} DevLog` : "Projects"}
            </h1>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              {selectedProject ? (
                <ProjectDevLogsList project={selectedProject} />
              ) : (
                <DevLogsList />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-mainbg m-2 md:m-8 cursor-default`}>
      <div className="mx-auto">
        {/* Full screen grid with 12 equal columns and 12 equal rows */}
        <div className="grid grid-cols-12 grid-rows-12 gap-2 md:gap-2 h-[140vh] md:h-[92vh]">
          {/* Banner Section */}
          <div className="col-start-1 col-end-13 row-start-1 row-end-3 md:row-end-7 md:col-end-6">
            <BannerSection banners={banners} totalBanners={banners.length} />
          </div>

          {/* Intro Section */}
          <div className="col-start-1 col-end-13 row-start-5 row-end-8 md:col-start-6 md:col-end-10 md:row-start-1 md:row-end-7">
            <IntroSection onKnowMoreClick={() => handleSectionClick("about")} />
          </div>

          <div className="col-start-1 col-end-13 row-start-8 row-end-10 md:col-start-10 md:col-end-13 md:row-start-10 md:row-end-13">
            <WeekNotesBoxSection />
          </div>

          {/* Blogs Section */}
          <div className="col-start-1 col-end-13 row-start-10 row-end-13 md:row-start-7 md:col-end-10 md:row-end-13">
            <BlogsBoxSection />
          </div>

          {/* DevLog Section */}
          <div className="col-start-1 col-end-13 row-start-3 row-end-5 md:row-start-1 md:col-start-10 md:row-end-10">
            <DevLogBoxSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
