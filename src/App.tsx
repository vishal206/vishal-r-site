import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";
import { banners } from "./Utils/constants";
import AboutSection from "./components/aboutSection";
import BlogList from "./Pages/BlogList";
import WeekNotesList from "./Pages/WeekNotesList";
import DevLogsList from "./Pages/DevLogsList";
import BannerBox from "./components/boxes/bannerBox";
import IntroBox from "./components/boxes/introBox";
import WeekNotesBox from "./components/boxes/weekNotesBox";
import BlogsBox from "./components/boxes/blogsBox";
import DevLogBox from "./components/boxes/devLogBox";

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
      <div className={`min-h-screen bg-secondarybg p-4 md:p-6 pb-8`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="mb-6">
            <button
              onClick={closeSectionView}
              className="text-secondary text-sm font-light border-b border-text-secondary transition-all cursor-pointer pb-0.5 hover:font-medium"
            >
              ← Back to Home
            </button>
          </div>
          <div className={`h-[calc(100vh-8rem)]`}>
            <h1
              className={`text-xl md:text-2xl font-serif text-secondary mb-6`}
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
      <div className={`min-h-screen bg-secondarybg p-4 md:p-6 pb-8`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="mb-6">
            <button
              onClick={closeSectionView}
              className="text-secondary text-sm font-light border-b border-text-secondary transition-all cursor-pointer pb-0.5 hover:font-medium"
            >
              ← Back to Home
            </button>
          </div>
          <div className={`h-[calc(100vh-8rem)]`}>
            <h1
              className={`md:text-2xl text-xl font-serif text-secondary mb-6`}
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
    return (
      <div className={`min-h-screen bg-secondarybg p-4 md:p-6 pb-8`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="mb-6">
            <button
              onClick={closeSectionView}
              className="text-secondary text-sm font-light border-b border-text-secondary transition-all cursor-pointer pb-0.5 hover:font-medium"
            >
              ← Back to Home
            </button>
          </div>
          <div className={`h-[calc(100vh-8rem)]`}>
            <h1
              className={`text-xl md:text-2xl font-serif text-secondary mb-6`}
            >
              {`DevLogs`}
            </h1>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <DevLogsList />
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
          <div className="col-start-1 col-end-13 row-start-1 row-end-2 md:row-end-7 md:col-end-6 transition-all duration-600">
            <BannerBox banners={banners} totalBanners={banners.length} />
          </div>

          <div className="col-start-1 col-end-13 row-start-2 row-end-5 md:col-start-6 md:col-end-10 md:row-start-1 md:row-end-7 transition-all duration-600">
            <IntroBox onKnowMoreClick={() => handleSectionClick("about")} />
          </div>

          <div className="col-start-1 col-end-13 row-start-7 row-end-9 md:col-start-10 md:col-end-13 md:row-start-10 md:row-end-13 transition-all duration-600">
            <WeekNotesBox />
          </div>

          {/* Blogs Section */}
          <div className="col-start-1 col-end-13 row-start-9 row-end-13 md:row-start-7 md:col-end-10 md:row-end-13 transition-all duration-600">
            <BlogsBox />
          </div>

          {/* DevLog Section */}
          <div className="col-start-1 col-end-13 row-start-5 row-end-7 md:row-start-1 md:col-start-10 md:row-end-10 transition-all duration-600">
            <DevLogBox />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
