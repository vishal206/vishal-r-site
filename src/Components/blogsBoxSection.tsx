import React from "react";
import { useNavigate } from "react-router-dom";
import BlogList from "../Pages/BlogList";

const BlogsBoxSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={`bg-background-secondary rounded-xl p-6 h-full`}>
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-base md:text-2xl font-primary font-black text-primary tracking-widest`}
        >
          Blogs
        </h2>
        <button
          onClick={() => navigate("/?section=blog")}
          className={`font-primary font-black text-primary text-xs hover:md:text-sm tracking-widest transition-all self-center cursor-pointer`}
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
