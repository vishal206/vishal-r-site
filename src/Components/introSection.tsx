import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faSquareGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faDownload,
  faBriefcase,
  faSchool,
} from "@fortawesome/free-solid-svg-icons";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";

interface IntroSectionProps {
  onKnowMoreClick: () => void;
}

const IntroSection: React.FC<IntroSectionProps> = ({ onKnowMoreClick }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank");
  };

  const getIconScale = (index: number) => {
    if (hoveredIndex === null) return 1;

    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.3; // 125% for hovered icon
    if (distance === 1) return 1.1; // 115% for adjacent icons
    // if (distance === 2) return 1.05; // 105% for next icons
    return 1; // 100% for distant icons
  };

  const getIconTranslateY = (index: number) => {
    if (hoveredIndex === null) return 0;

    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return -8; // -8px for hovered icon
    if (distance === 1) return -4; // -4px for adjacent icons
    // if (distance === 2) return -2; // -2px for next icons
    return 0; // 0px for distant icons
  };

  const socialIcons = [
    {
      icon: faLinkedin,
      action: () =>
        handleExternalLink("https://linkedin.com/in/vishal-r-profile"),
    },
    {
      icon: faSquareGithub,
      action: () => handleExternalLink("https://github.com/vishal206"),
    },
    { icon: faDownload, action: () => handleExternalLink(Vishal_Resume) },
    { icon: faBriefcase, action: onKnowMoreClick },
    { icon: faSchool, action: onKnowMoreClick },
  ];

  return (
    <div
      className={`bg-background-grid-section rounded-lg md:p-6 p-4 h-full flex flex-col justify-between`}
    >
      <div>
        <div className="md:text-3xl text-xl font-serif text-center mb-4 md:mb-5 text-white">
          Hello, I'm Vishal R
        </div>
        <p className="text-xs md:text-md font-sans text-center mb-4 md:mb-8  text-gray-200">
          I’m Vishal R, a BI & Analytics Engineer working at the intersection of
          AI, data, and web engineering. I build products that make data easier
          to understand — from intelligent dashboards to conversational
          insights.
        </p>

        {/* Social Icons */}
        <div
          className="flex justify-center gap-5 md:mb-6 cursor-pointer"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {socialIcons.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              onMouseEnter={() => setHoveredIndex(index)}
              className="transition-all cursor-pointer transform hover:-translate-y-1 duration-300 ease-out"
              style={{
                transform: `scale(${getIconScale(
                  index
                )}) translateY(${getIconTranslateY(index)}px)`,
              }}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="text-white text-xl transition-all"
              />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onKnowMoreClick}
        className="text-gray-300 hover:text-white text-xs md:text-sm font-light border-b border-gray-400 hover:border-white transition-all self-center cursor-pointer pb-0.5 hover:pb-2 hover:font-medium"
      >
        Know More
      </button>
    </div>
  );
};

export default IntroSection;
