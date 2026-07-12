import { useState, useEffect } from "react";

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex items-end justify-center px-16 pt-16 pb-8 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 55% 70% at 50% 100%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, transparent 72%)",
      }}
    >
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-editorial-text text-editorial-bg rounded-full shadow-lg hover:opacity-80 transition-opacity cursor-pointer"
        aria-label="Scroll to top"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};

export default ScrollToTopButton;
