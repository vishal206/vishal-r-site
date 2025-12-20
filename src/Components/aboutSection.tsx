import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import {
  faLinkedin,
  faSquareGithub,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import Timeline from "../Pages/Timeline";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";
import ReactMarkdown from "react-markdown";

interface AboutSectionProps {
  onClose: () => void;
}

const AboutSection: React.FC<AboutSectionProps> = ({ onClose }) => {
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

  const aboutValue = `I’m Vishal R, currently working as a **Business Intelligence & Analytics Engineer 1** at Condé Nast Technology Lab, where I focus on building and contributing on solutions across data visualization, analytics, and AI-driven applications. My work includes contributing to an AI-powered insights assistant that connects Qlik with OpenAI (via **LangChain**) to enable natural language queries, collaborating on an enterprise analytics platform that delivers content and traffic insights, and independently developing mashups such as OKR and executive dashboards powered by Google Sheets metadata for flexible, no-code configuration. I have also contributed on supporting tools like a Chrome Extension for instant analytics access and Slack integrations with Qlik automations to improve reporting and team workflows.
                
  Outside work, I stay engaged through hackathons, developer events, and certifications. At the Condé Nast Hackathon, my team secured **3rd place** with PokétAik, an AI-based chat assistant for data summaries and role-specific responses. At **Google’s Agentic AI Day**, I explored Gemini APIs, Firebase, and rapid prototyping workflows, gaining hands-on experience with the broader AI ecosystem. I’ve also attended events like **DevFest** and Build with AI, where I learned about the latest in LLMs, design-driven product development, and cloud-native AI tools. Alongside these, I’ve completed certifications including AWS Cloud Practitioner, Advanced React (Meta), and UX/UI Design (Meta), strengthening my technical foundation and broadening my perspective on building effective user-facing solutions.
                
  Before joining Condé Nast, I worked as a Software Development Engineer Intern at Vite Fintech Pvt Ltd and Antpod Remote, where I developed Android applications, worked with REST APIs, and built a strong base in **Java and mobile development**.`;

  return (
    <div className={` bg-mainbg p-4 md:p-6`}>
      <div className=" mx-auto">
        {/* Full screen grid with 12 equal columns and 12 equal rows */}
        <div className="grid grid-cols-12 md:grid-rows-12 grid-rows-14 md:gap-6 gap-2 md:h-[95vh] h-[130vh]">
          {/* About Me Box */}
          <div className="col-start-1 md:col-end-6 col-end-13 md:row-start-1 row-start-2 md:row-end-13 row-end-6">
            <div
              className={`bg-background-secondary rounded-lg p-6 h-full overflow-y-auto`}
            >
              <h1 className="md:text-3xl font-serif text-gray-800 md:mb-4">
                About Me
              </h1>
              <p className="text-gray-700 leading-relaxed md:text-sm text-xs whitespace-pre-line">
                <ReactMarkdown>{aboutValue}</ReactMarkdown>
              </p>
            </div>
          </div>

          {/* Social Media Box */}
          <div className="md:col-start-6 col-start-1 md:col-end-11 col-end-11 md:row-start-1 row-start-1 md:row-end-3 row-end-2">
            <div
              className={`bg-background-grid-section rounded-lg h-full flex items-center justify-center`}
            >
              <div className="flex gap-4">
                {socialLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => handleExternalLink(link.url)}
                    className="group relative md:bg-background-secondary/20 backdrop-blur-sm rounded-lg md:p-2 md:px-4 transition-all duration-300 hover:scale-110 hover:-translate-y-2 md:shadow-lg md:hover:shadow-xl flex-1 min-w-0 cursor-pointer"
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
            className={`md:col-start-11 col-start-11 col-end-13 md:row-start-1 md:row-end-3 row-start-1 row-end-2 flex justify-center items-center bg-background-tertiary rounded-lg`}
          >
            <button
              onClick={onClose}
              className={`text-text-primary w-full p-2 rounded-lg cursor-pointer flex flex-col items-center gap-2`}
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

          {/* Work Experience Box - Left Side */}
          <div className="md:col-start-6 col-start-1 md:col-end-10 col-end-13 md:row-start-3 row-start-6 md:row-end-13 row-end-13">
            <div
              className={`bg-background-secondary rounded-lg p-6 h-full overflow-y-auto`}
            >
              <Timeline sectionName="Experience" />
            </div>
          </div>

          {/* Education Box - Right Side */}
          <div className="md:col-start-10 col-start-1 col-end-13 md:row-start-3 row-start-13 md:row-end-13 row-end-15">
            <div
              className={`bg-background-secondary rounded-lg p-6 h-full overflow-y-auto`}
            >
              <Timeline sectionName="Education" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
