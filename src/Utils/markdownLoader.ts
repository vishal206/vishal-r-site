export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string;
  image?: string;
  tags?: string;
  [key: string]: any;
};

export type BlogPost = {
  slug: string;
  frontmatter: BlogPostMeta;
  content: string;
};

// Use Vite's import.meta.glob to load all markdown files at build time
const blogPostFiles = import.meta.glob("/src/Posts/BlogPosts/*.md", {
  eager: true,
  as: "raw",
});

/** Gets the slugs of all available blog posts. */
export const getAvailablePosts = (): string[] =>
  Object.keys(blogPostFiles)
    .map((path) => path.match(/\/([^/]+)\.md$/)?.[1] ?? "")
    .filter(Boolean);

/**
 * Simple frontmatter parser for browser environment
 * This avoids the Buffer not defined error from gray-matter
 */
const parseFrontmatter = (
  markdown: string,
): { data: Record<string, any>; content: string } => {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: markdown };
  }

  const frontmatter = match[1];
  const content = markdown.replace(frontmatterRegex, "").trim();

  // Parse the frontmatter
  const data: Record<string, any> = {};
  frontmatter.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length) {
      // Join the value parts back together in case the value itself contained colons
      let value = valueParts.join(":").trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      data[key.trim()] = value;
    }
  });

  return { data, content };
};

/**
 * Synchronously loads a markdown file. The glob above is `eager`, so all files
 * are already in memory — no async needed. Used for first-paint/SSR-style render.
 */
export const loadMarkdownFileSync = (slug: string): BlogPost | null => {
  try {
    const filePath = Object.keys(blogPostFiles).find((path) =>
      path.includes(`/${slug}.md`),
    );
    if (!filePath) {
      console.error(`No file found for slug: ${slug}`);
      return null;
    }

    const { data, content } = parseFrontmatter(blogPostFiles[filePath] as string);

    const frontmatter: BlogPostMeta = {
      slug,
      title: data.title || "Untitled",
      date: data.date || new Date().toISOString().split("T")[0],
      ...data,
    };

    return { slug, frontmatter, content };
  } catch (err) {
    console.error(`Error loading markdown file ${slug}:`, err);
    return null;
  }
};

// ── About Chapters ──────────────────────────────────────────────────────────

const chapterFiles = import.meta.glob("/src/Posts/About/*.md", {
  eager: true,
  as: "raw",
});

export type ChapterMeta = {
  slug: string;
  title: string;
  sno: number;
  [key: string]: any;
};

export type Chapter = {
  slug: string;
  frontmatter: ChapterMeta;
  content: string;
};

export const getAvailableChapters = (): string[] =>
  Object.keys(chapterFiles)
    .map((path) => path.match(/\/([^/]+)\.md$/)?.[1] ?? "")
    .filter(Boolean);

export const loadChapterFileSync = (slug: string): Chapter | null => {
  try {
    const filePath = Object.keys(chapterFiles).find((p) => p.endsWith(`/${slug}.md`));
    if (!filePath) return null;
    const { data, content } = parseFrontmatter(chapterFiles[filePath] as string);
    return {
      slug,
      frontmatter: { slug, title: data.title ?? "Untitled", sno: parseInt(data.sno ?? "0", 10), ...data },
      content,
    };
  } catch (err) {
    console.error(`Error loading chapter ${slug}:`, err);
    return null;
  }
};

/** Async wrapper kept for existing callers. */
export const loadChapterFile = async (slug: string): Promise<Chapter | null> =>
  loadChapterFileSync(slug);
