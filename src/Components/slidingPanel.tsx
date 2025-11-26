import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { sections } from "../Utils/constants";

interface SlidingPanelProps {
  activePanel: string | null;
  closePanel: () => void;
}

const SlidingPanel: React.FC<SlidingPanelProps> = ({
  activePanel,
  closePanel,
}) => {
  const activeSection = sections.find((section) => section.id === activePanel);
  return (
    <>
      {activePanel && activeSection && (
        <div className={`relative h-[85%] md:h-full md:w-2/3 bg-background-secondary z-50 shadow-lg overflow-hidden rounded-lg`}>
          {/* Close Button (Outside scrollable div) */}
          <button
            onClick={closePanel}
            className={`rounded-lg z-99 absolute text-md bottom-4 right-4 md:bottom-auto md:top-4 text-text-primary bg-background-tertiary hover:bg-[#787c82]/50 hover:text-gray-100  px-2.5 py-1`}
          >
            <FontAwesomeIcon icon={faX} />
          </button>

          {/* Scrollable Content */}
          <div className="p-6 h-full overflow-y-auto m-2">
            <div className="text-3xl mb-2 text-black font-serif">
              {activeSection.title}
            </div>
            <div className="text-gray-700">{activeSection.content}</div>
            {activeSection.sectionComponent && (
              <activeSection.sectionComponent />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SlidingPanel;
