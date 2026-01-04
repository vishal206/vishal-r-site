import condeNastLogoC from "../assets/condeNastLogoC.jpg";
import Vishal_Resume from "../assets/Vishal_Resume.pdf";
import {
  faBriefcase,
  faDownload,
  faNewspaper,
  faSchool,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin, faSquareGithub } from "@fortawesome/free-brands-svg-icons";
import {
  BlogsSection,
  EducationSection,
  WorkExperienceSection,
} from "./sectionComponents";

export const experiences = [
  {
    year: "Aug 2023 - Present",
    company: "Condé Nast Technology Lab",
    role: "Business Intelligence & Analytics Engineer 1",
    companyLogo: condeNastLogoC,
    description: [
      "* Mercury (AI-Powered Insights Assistant): Developed a natural language interface for Qlik datasets by integrating OpenAI (via **LangChain**), enabling **Query chaining**, **RAG**, and multi-hypercube queries for accurate insights and visualizations.",
      "* In Mercury, Built a metadata-driven flow by fetching fields, brands, and markets, caching context per session, and passing it to the LLM for **fine-tuning** query generation and delivering more accurate responses.",
      "* In Mercury, Enhanced usability with guided prompts, contextual help, dynamic placeholders, and suggested questions to improve user experience for business stakeholders.",
      "* Beacon, An Enterprise Analytics Platform: Contributed to features such as traffic segmentation, trend analysis, and Top Pages dashboards, while improving data reliability by refining filters, aligning KPIs, and resolving query issues.",
      "* OKR Mashup, An Performance Dashboards: Developed dashboards using Qlik hooks connection with hypercubes/expressions, resolving data reliability issues and improving KPI tracking.",
      "* Executive Dashboard Template: Built a configurable React dashboard powered by Google Sheets metadata, enabling Qlik developers to deploy new mashups or dashboards through sheet updates **without modifying code**.",
      "* Analytics **Chrome Extension**: Developed a Chrome Extension (React + Chrome APIs) to auto-detect brand sites and surface analytics instantly for editors.",
      "Slack & Automations: Implemented **Slack API** integrations and Qlik SaaS automations (with OpenAI connector) to streamline reporting, alerts, and collaboration.",
    ],
  },
  {
    year: "Jan 2022 - May 2023",
    company: "Vite Fintech Pvt Ltd",
    role: "Software Development Engineer Intern",
    description: [
      "* Developed Vite Fintech’s Android application and **B2C website**.",
      "* Integrated **REST APIs** and SDKs for banking services such as recharge, bill payment, and Aadhar pay into the Android application.",
      "* Customized applications for multiple clients and launched them on the Play Store.",
      "* Integrated **fingerprint scanning device** and **Micro ATM device SDKs** into the Android application.",
      "* Developed the full website from scratch using ReactJS and integrated REST API for user registration.",
    ],
  },
];

export const educations = [
  {
    year: "2019 - 2023",
    company: "Vellore Institute of Technology",
    role: "Bachelor’s degree in Computer Science and Engineering",
    description: [],
  },
  {
    year: "",
    company: "Maharishi Vidhya Mandir(CBSE)",
    role: "Higher secondary",
    description: [],
  },
];

export const sections = [
  {
    id: "blog",
    title: "Blogs",
    // content: "Details about Blogs.",
    logo: faNewspaper,
    isExternal: false,
    sectionComponent: BlogsSection,
  },
  {
    id: "work",
    title: "Work Experience",
    content: "Details about work experience.",
    logo: faBriefcase,
    isExternal: false,
    sectionComponent: WorkExperienceSection,
  },
  {
    id: "linkedIn",
    title: "LinkedIn",
    link: "https://linkedin.com/in/vishal-r-profile",
    logo: faLinkedin,
    isExternal: true,
  },
  {
    id: "github",
    title: "Git Hub",
    link: "https://github.com/vishal206",
    logo: faSquareGithub,
    isExternal: true,
  },
  {
    id: "resume",
    title: "Download Resume",
    link: Vishal_Resume,
    logo: faDownload,
    isExternal: true,
  },
  {
    id: "education",
    title: "Education",
    content: "Details about education.",
    logo: faSchool,
    isExternal: false,
    sectionComponent: EducationSection,
  },
];

export const banners = [
  {
    imageUrl:
      "https://github.com/vishal206/personal-site-images/blob/main/osi-cover.png?raw=true",
  },
];

// Add project images configuration
export const projectImages: { [key: string]: string } = {
  wishlist:
    "https://github.com/vishal206/personal-site-images/blob/main/aa-day-hackathon-2025.png?raw=true",
  WeSaige:
    "https://github.com/vishal206/personal-site-images/blob/main/wesaige-devlog-2.png?raw=true",
  "Me Now Plan":
    "https://github.com/vishal206/personal-site-images/blob/main/me-now-plan-logo-high-res.png?raw=true",
  // Add more projects as needed
};

// Add project descriptions configuration
export const projectDescriptions: { [key: string]: string } = {
  wishlist: "A smart wishlist management application",
  WeSaige: "A lifestyle brand that helps your flow in life",
  // Add more project descriptions as needed
};
