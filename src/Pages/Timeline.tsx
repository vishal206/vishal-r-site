import React from "react";
import { educations, experiences } from "../Utils/constants";
import ReactMarkdown from "react-markdown";

type timeLine = {
  sectionName: string;
};

type TimeLineData = {
  year: string;
  company: string;
  role: string;
  description: string[];
  companyLogo?: string;
};

const Timeline: React.FC<timeLine> = ({ sectionName }) => {
  const datas: TimeLineData[] =
    sectionName === "Experience" ? experiences : educations;

  return (
    <div className="space-y-6">
      {datas.map((data, index) => (
        <div key={index}>
          <div className="flex flex-col items-center justify-between text-center mb-1">
            <div className="md:text-2xl font-sans font-light leading-tight text-gray-900">{data.company}</div>
            <div className="text-xs text-gray-500 font-light">{data.year}</div>
            <div className="text-xs text-gray-600 mb-3">{data.role}</div>
          </div>
          
          
          <ul className="space-y-2 px-2">
            {data.description.map((des, idx) => (
              <li key={idx} className="md:text-sm text-xs text-gray-700 leading-relaxed list-disc">
                <ReactMarkdown>
                  {des}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
