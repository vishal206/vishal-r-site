import BlogList from "../Pages/BlogList";
import Timeline from "../Pages/Timeline";

export const BlogsSection = () => <BlogList />;
export const WorkExperienceSection = () => <Timeline sectionName={"Experience"}/>;
export const EducationSection = () => <Timeline sectionName={"Education"}/>;
export const ResumeSection = () => <div>Resume Download Section</div>;
export const LinkedInSection = () => <div>LinkedIn Profile</div>;
export const GitHubSection = () => <div>GitHub Profile</div>;
