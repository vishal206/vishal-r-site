import { useState } from "react";
import { ABOUT_FOLDER_VALUES } from "../Utils/constants";
import { MarkdownReader } from "./markdownReader";

export const FolderView = () => {
  const [selectedFolderIndex, setSelectedFolderIndex] = useState(0);
  const foldersDetail = ABOUT_FOLDER_VALUES;

  return (
    <div className="w-full h-full transition-all duration-600">
      <div className="flex flex-col md:flex-row gap-2 md:items-end items-start">
        <div className={`p-2 rounded-t-3xl pr-4 cursor-default`}>
          <h2 className="text-base font-bold font-serif">
            Chapters of my life
          </h2>
        </div>
        {foldersDetail.map((folder, index) => {
          return (
            <div
              key={index}
              onClick={() => setSelectedFolderIndex(index)}
              className={`px-3 py-2 rounded-t-xl pr-8 cursor-pointer transition-all duration-300 ${index === selectedFolderIndex ? "pb-3" : ""}`}
              style={{
                backgroundColor: folder.colorCode,
              }}
            >
              <h2 className="text-sm font-medium tracking-wide">
                {folder.title}
              </h2>
            </div>
          );
        })}
      </div>

      <div
        className="w-full h-full rounded-b-3xl rounded-tr-3xl md:rounded-3xl p-4 overflow-y-auto"
        style={{
          backgroundColor: foldersDetail[selectedFolderIndex].colorCode,
        }}
      >
        <MarkdownReader content={foldersDetail[selectedFolderIndex].content} />
      </div>
    </div>
  );
};
