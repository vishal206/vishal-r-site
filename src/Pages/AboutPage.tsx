import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import {
  faLinkedin,
  faSquareGithub,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";
import { MarkdownReader } from "../components/markdownReader";
import { FolderView } from "../components/FolderView";

interface AboutSectionProps {
  onClose: () => void;
}

const AboutPage: React.FC<AboutSectionProps> = ({ onClose }) => {
  const handleExternalLink = (url: string) => {
    window.open(url, "_blank");
  };

  const socialLinks = [
    {
      icon: faLinkedin,
      label: "LinkedIn",
      url: "https://linkedin.com/in/vishal-r-profile",
    },
    {
      icon: faSquareGithub,
      label: "GitHub",
      url: "https://github.com/vishal206",
    },
    { icon: faDownload, label: "Resume", url: Vishal_Resume },
    { icon: faXTwitter, label: "X", url: "https://x.com/vishal_r_dev" },
  ];

  const aboutValue = `**Business Intelligence & Analytics Engineer 1** @ Condé Nast.
  
  **Bachelor’s degree in Computer Science and Engineering** from Vellore Institute of Technology (VIT), India.`;

  return (
    <div className={`bg-[#F5ECDB] p-4 md:p-8`}>
      <div className=" mx-auto">
        {/* Full screen grid with 12 equal columns and 12 equal rows */}
        <div className="grid grid-cols-12 grid-rows-12 gap-2 md:gap-4 h-[140vh] md:h-[96vh]">
          {/* About Me Box */}
          <div className="col-start-1 col-end-13 row-start-2 md:col-end-4 md:row-start-3 md:row-end-6 row-end-6">
            <div
              className={`bg-secondarybg rounded-3xl p-4 h-full overflow-y-auto`}
            >
              <p className="text-gray-700 leading-relaxed md:text-sm text-xs whitespace-pre-line">
                <MarkdownReader content={aboutValue} />
              </p>
            </div>
          </div>

          {/* Social Media Box */}
          <div className=" col-start-1 col-end-11 row-start-1 row-end-2 md:col-start-1 md:col-end-4 md:row-start-11 md:row-end-12">
            <div
              className={`rounded-3xl h-full flex items-center justify-center`}
            >
              <div className="flex gap-4">
                {socialLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => handleExternalLink(link.url)}
                    className="group relative md:bg-mainbg/50 backdrop-blur-sm rounded-xl md:p-2 md:px-4 transition-all duration-300 hover:scale-110 hover:-translate-y-2 md:shadow-lg md:hover:shadow-xl flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FontAwesomeIcon
                        icon={link.icon}
                        className="md:text-2xl text-2xl text-white group-hover:text-background-secondary transition-colors duration-300"
                      />
                      <span className="hidden md:block text-xs text-white/80 group-hover:text-white font-light truncate">
                        {link.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Close Button Box */}
          <div
            className={` col-start-11 col-end-13 row-start-1 row-end-2 md:col-start-1 md:col-end-4 md:row-start-1 md:row-end-3 flex justify-center items-center bg-[#53728d] rounded-3xl`}
          >
            <button
              onClick={onClose}
              className={` text-primary w-full p-2 rounded-3xl cursor-pointer flex flex-col items-center gap-2`}
            >
              <FontAwesomeIcon
                icon={faHome}
                className="md:text-3xl text-base hover:text-4xl"
              />
              <span className="hidden md:block text-xs text-white/80 group-hover:text-white font-light truncate">
                {"Back to Home"}
              </span>
            </button>
          </div>

          <div className="row-start-1 row-end-12 col-start-4 col-end-13">
            <FolderView />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
