import React from "react";
import { useNavigate } from "react-router-dom";
import BlogList from "../Pages/BlogList";

const BlogsBoxSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={`bg-background-secondary rounded-xl p-6 h-full`}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 items-start justify-start">
        <h2
          className={`text-base md:text-2xl font-primary font-black text-primary tracking-widest`}
        >
          Blogs
        </h2>
        <button
          onClick={() => navigate("/?section=blog")}
          className={`flex justify-start md:justify-end w-full font-primary font-black text-primary text-[10px] md:text-xs hover:md:text-sm tracking-widest transition-all self-center cursor-pointer`}
        >
          Find More Blogs I wrote {">>>>"}
        </button>
      </div>
      <div className="md:max-h-96 max-h-64 overflow-y-auto">
        <BlogList />
      </div>
    </div>
  );
};

export default BlogsBoxSection;
