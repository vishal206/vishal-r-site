import RSS from "rss";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const toRssHtml = (markdown, baseUrl) => {
  const html = marked(markdown);
  return html
    // Make all relative image src URLs absolute
    .replace(/src="\/([^"]+)"/g, `src="${baseUrl}/$1"`)
    // Replace float styles (won't work in RSS readers) with centered block
    .replace(
      /<img([^>]*?)style="[^"]*float[^"]*"([^>]*?)>/g,
      (_, before, after) =>
        `<img${before}${after} style="display:block;margin:1em auto;max-width:100%;">`
    );
};

const generateRSSFeed = async () => {
  const baseUrl = "https://vishalr.dev";

  const feed = new RSS({
    title: "Vishal R",
    description: "Blogs, movies, books, and project writing from Vishal R",
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

      // ✅ Posts can explicitly opt out of RSS (e.g. migrated weeknotes)
      if (frontmatter.publishRss === false) continue;

      const slug = file.replace(".md", "");

      items.push({
        title: frontmatter.title,
        url: `${baseUrl}/archive/${slug}`,
        description: content.substring(0, 300).replace(/[<>]/g, "") + "...",
        content,
        date: new Date(frontmatter.date),
        categories: [frontmatter.tags || "Blog"],
      });
    }
  }

  // Process project write-ups (each project folder's non-readme posts;
  // the readme itself is a static overview page, not a dated entry)
  const projectsDir = path.join(process.cwd(), "src/Posts/Projects");

  if (fs.existsSync(projectsDir)) {
    for (const projectSlug of fs.readdirSync(projectsDir)) {
      const projectDir = path.join(projectsDir, projectSlug);
      if (!fs.statSync(projectDir).isDirectory()) continue;

      const postFiles = fs
        .readdirSync(projectDir)
        .filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md");

      for (const file of postFiles) {
        const filePath = path.join(projectDir, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data: frontmatter, content } = matter(fileContent);

        // ✅ Posts can explicitly opt out of RSS
        if (frontmatter.publishRss === false) continue;

        const slug = file.replace(".md", "");

        items.push({
          title: frontmatter.title,
          url: `${baseUrl}/archive/${slug}`,
          description: content.substring(0, 300).replace(/[<>]/g, "") + "...",
          content,
          date: new Date(frontmatter.date),
          categories: [frontmatter.tags || "Project"],
        });
      }
    }
  }

  // Process books
  const booksDir = path.join(process.cwd(), "src/Posts/Books");

  if (fs.existsSync(booksDir)) {
    const bookFiles = fs
      .readdirSync(booksDir)
      .filter((file) => file.endsWith(".md"));

    for (const file of bookFiles) {
      const filePath = path.join(booksDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data: frontmatter, content } = matter(fileContent);

      // ✅ Books can explicitly opt out of RSS
      if (frontmatter.publishRss === false) continue;

      const slug = file.replace(".md", "");

      items.push({
        title: frontmatter.title,
        url: `${baseUrl}/book/${slug}`,
        description: content.substring(0, 300).replace(/[<>]/g, "") + "...",
        content,
        date: new Date(frontmatter.date),
        categories: ["Book"],
      });
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
        custom_elements: [{ "content:encoded": { _cdata: toRssHtml(item.content, baseUrl) } }],
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
