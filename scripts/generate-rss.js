import RSS from "rss";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const generateRSSFeed = async () => {
  const baseUrl = "https://vishalr.dev";

  const feed = new RSS({
    title: "Vishal R",
    description: "Blogs, WeekNotes, and DevLogs from Vishal R",
    feed_url: `${baseUrl}/rss.xml`,
    site_url: baseUrl,
    language: "en-us",
    pubDate: new Date(),
  });

  const items = [];

  // Process blogs
  const blogDir = path.join(process.cwd(), "src/Posts/BlogPosts");
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs
      .readdirSync(blogDir)
      .filter((file) => file.endsWith(".md"));

    for (const file of blogFiles) {
      const filePath = path.join(blogDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data: frontmatter, content } = matter(fileContent);
      const slug = file.replace(".md", "");

      items.push({
        title: frontmatter.title,
        url: `${baseUrl}/blog/${slug}`,
        description: content.substring(0, 300).replace(/[<>]/g, "") + "...",
        date: new Date(frontmatter.date),
        categories: ["Blog"],
      });
    }
  }

  // Process weeknotes
  const weekNotesDir = path.join(process.cwd(), "src/Posts/WeekNotes");

  if (fs.existsSync(weekNotesDir)) {
    const weekNoteFiles = fs
      .readdirSync(weekNotesDir)
      .filter((file) => file.endsWith(".md"));

    for (const file of weekNoteFiles) {
      const filePath = path.join(weekNotesDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data: frontmatter, content } = matter(fileContent);

      // ✅ Only include selected weeknotes
      if (!frontmatter.publishRss) continue;

      const slug = file.replace(".md", "");

      items.push({
        title: frontmatter.title,
        url: `${baseUrl}/weeknote/${slug}`,
        description: content.substring(0, 300).replace(/[<>]/g, "") + "...",
        date: new Date(frontmatter.date),
        categories: ["WeekNote"],
      });
    }
  }

  // Process devlogs
  const devLogsDir = path.join(process.cwd(), "src/Posts/DevLogs");
  if (fs.existsSync(devLogsDir)) {
    const projects = fs
      .readdirSync(devLogsDir)
      .filter((item) => fs.statSync(path.join(devLogsDir, item)).isDirectory());

    for (const project of projects) {
      const projectDir = path.join(devLogsDir, project);
      const devLogFiles = fs
        .readdirSync(projectDir)
        .filter((file) => file.endsWith(".md"));

      for (const file of devLogFiles) {
        const filePath = path.join(projectDir, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data: frontmatter, content } = matter(fileContent);
        const slug = file.replace(".md", "");

        items.push({
          title: `${project}: ${frontmatter.title}`,
          url: `${baseUrl}/devlog/${project}/${slug}`,
          description: content.substring(0, 300).replace(/[<>]/g, "") + "...",
          date: new Date(frontmatter.date),
          categories: ["DevLog", project],
        });
      }
    }
  }

  // Sort by date (newest first) and add to feed
  items
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .forEach((item) => {
      feed.item({
        title: item.title,
        url: item.url,
        description: item.description,
        date: item.date,
        categories: item.categories,
        guid: item.url,
      });
    });

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write RSS file
  const xml = feed.xml({ indent: true });
  fs.writeFileSync(path.join(publicDir, "rss.xml"), xml);
  console.log("RSS feed generated at public/rss.xml");
};

generateRSSFeed().catch(console.error);
