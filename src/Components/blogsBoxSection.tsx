import React from "react";
import { useNavigate } from "react-router-dom";
import BlogList from "../Pages/BlogList";

const BlogsBoxSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={`bg-background-secondary rounded-lg p-6 h-full`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-base md:text-2xl font-serif text-text-secondary`}>
          Blogs
        </h2>
        <button
          onClick={() => navigate("/?section=blog")}
          className={`text-gray-400 hover:text-gray-600 text-xs md:text-sm font-light border-b border-gray-400 hover:border-gray-600 transition-all self-center cursor-pointer pb-0.5 hover:pb-2 hover:font-medium`}
        >
          More
        </button>
      </div>
      <div className="md:max-h-96 max-h-64 overflow-y-auto">
        <BlogList from="box" />
      </div>
    </div>
  );
};

export default BlogsBoxSection;
