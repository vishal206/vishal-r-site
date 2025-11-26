import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { sections } from "../Utils/constants";

interface GridSectionProps {
  handleBoxClick: (id: string, isExternal: boolean, link?: string) => void;
  activePanel: string | null;
}

const GridSection: React.FC<GridSectionProps> = ({
  handleBoxClick,
  activePanel,
}) => {
  const [isSectionActive, setIsSectionActive] = useState(false);

  const handleClick = (id: string, isExternal: boolean, link?: string) => {
    setIsSectionActive(true); // Set to true when a section is selected
    handleBoxClick(id, isExternal, link);
  };

  useEffect(() => {
    if (!activePanel) {
      setIsSectionActive(false); // Reset when the active screen is closed
    }
  }, [activePanel]);

  return (
    <>
      {/* Content Section - Hidden on mobile when a section is active */}
      <div
        className={`bg-background-grid-section  rounded-lg overflow-y-auto p-6 w-full h-[60%] md:w-1/3 md:h-full text-text-primary transition-all ${isSectionActive ? "hidden md:block" : ""} mb-4`}
      >

        <div className="text-3xl font-serif text-center">
          Hello, I'm Vishal R
        </div>
        <p className="text-sm md:text-md font-sans text-center p-4 mb-2">
          I’m currently an Associate BI Engineer at Condé Nast Technology Lab. I
          love building products and discussing them!
        </p>
        <div
          className={`text-text-primary grid md:grid-cols-2 grid-cols-3 gap-1.5`}
        >
          {sections.map((section) => (
            <div
              key={section.id}
              className={`shadow-lg rounded-lg h-full w-full flex flex-col flex-grow items-start gap-2 justify-start p-4 cursor-pointer hover:shadow hover:opacity/80 transition 
              ${
                section.id === activePanel
                  ? "bg-[#787c82]/50 "
                  :  "bg-background-grid-box "
              }`}
              onClick={() =>
                handleClick(section.id, section.isExternal, section.link)
              }
            >
              {section.logo && (
                <div className="text-left text-lg">
                  <FontAwesomeIcon icon={section.logo} />
                </div>
              )}
              <div className="text-left font-medium text-sm break-words whitespace-normal">
                {section.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation - Visible only on mobile when a section is active */}
      {isSectionActive && (
        <div className={` rounded-lg w-full flex justify-around items-center py-2 shadow-md md:hidden bg-background-grid-section`}>
          {sections.map((section) => (
            <div
              key={section.id}
              className={`text-lg cursor-pointer ${
                section.id === activePanel
                  ? " text-black/50 md:text-white"
                  : "text-text-primary"
              }`}
              onClick={() =>
                handleClick(section.id, section.isExternal, section.link)
              }
            >
              <FontAwesomeIcon icon={section.logo} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default GridSection;
