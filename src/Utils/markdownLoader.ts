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

const projectFiles = import.meta.glob("/src/Posts/Projects/**/*.md", {
  eager: true,
  as: "raw",
});

/**
 * Gets all available blog posts, including non-readme posts inside project folders
 */
export const getAvailablePosts = (): string[] => {
  const blogSlugs = Object.keys(blogPostFiles)
    .map((path) => path.match(/\/([^/]+)\.md$/)?.[1] ?? "")
    .filter(Boolean);

  const projectPostSlugs = Object.keys(projectFiles)
    .filter((path) => !path.match(/\/readme\.md$/i))
    .map((path) => path.match(/\/([^/]+)\.md$/)?.[1] ?? "")
    .filter(Boolean);

  return [...blogSlugs, ...projectPostSlugs];
};

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
 * Loads a markdown file and parses its frontmatter and content
 */
export const loadMarkdownFile = async (
  slug: string,
): Promise<BlogPost | null> => {
  try {
    // Check BlogPosts first, then fall back to project post files
    let filePath = Object.keys(blogPostFiles).find((path) =>
      path.includes(`/${slug}.md`),
    );
    let rawContent: string;

    if (filePath) {
      rawContent = blogPostFiles[filePath] as string;
    } else {
      const projectPath = Object.keys(projectFiles).find(
        (path) =>
          path.includes(`/${slug}.md`) && !path.match(/\/readme\.md$/i),
      );
      if (!projectPath) {
        console.error(`No file found for slug: ${slug}`);
        return null;
      }
      filePath = projectPath;
      rawContent = projectFiles[projectPath] as string;
    }

    const { data, content } = parseFrontmatter(rawContent);

    // Auto-inject project field when loaded from a project folder
    const projectMatch = filePath.match(/\/Projects\/([^/]+)\//);
    if (projectMatch && !data.project) {
      data.project = projectMatch[1];
    }

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

// Add WeekNotes support
const weekNotesFiles = import.meta.glob("/src/Posts/WeekNotes/*.md", {
  eager: true,
  as: "raw",
});

export type WeekNoteMeta = {
  slug: string;
  title: string;
  date: string;
  weeknoteCount: number;
  [key: string]: any;
};

export type WeekNote = {
  slug: string;
  frontmatter: WeekNoteMeta;
  content: string;
};

/**
 * Gets all available week notes
 */
export const getAvailableWeekNotes = (): string[] => {
  return Object.keys(weekNotesFiles)
    .map((path) => {
      const match = path.match(/\/([^/]+)\.md$/);
      return match ? match[1] : "";
    })
    .filter(Boolean);
};

/**
 * Loads a specific week note by slug
 */
export const loadWeekNoteFile = async (
  slug: string,
): Promise<WeekNote | null> => {
  try {
    const filePath = `/src/Posts/WeekNotes/${slug}.md`;
    const fileContent = weekNotesFiles[filePath];

    if (!fileContent) {
      console.error(`Week note file not found: ${filePath}`);
      return null;
    }

    const { data, content } = parseFrontmatter(fileContent);

    return {
      slug,
      frontmatter: data as WeekNoteMeta,
      content,
    };
  } catch (error) {
    console.error(`Error loading week note ${slug}:`, error);
    return null;
  }
};

// Add DevLogs support
const devLogFiles = import.meta.glob("/src/Posts/DevLogs/**/*.md", {
  eager: true,
  as: "raw",
});

export type DevLogMeta = {
  slug: string;
  title: string;
  date: string;
  [key: string]: any;
};

export type DevLog = {
  slug: string;
  frontmatter: DevLogMeta;
  content: string;
};

/**
 * Gets all available devlog projects
 */
// export const getAvailableDevLogProjects = (): string[] => {
//   const projects = new Set<string>();
//   Object.keys(devLogFiles).forEach(path => {
//     const match = path.match(/\/DevLogs\/([^/]+)\//);
//     if (match) {
//       projects.add(match[1]);
//     }
//   });
//   return Array.from(projects);
// };

/**
 * Gets all devlogs for a specific project
 */
export const getDevLogs = (): string[] => {
  return Object.keys(devLogFiles)
    .filter((path) => path.includes(`/DevLogs/`))
    .map((path) => {
      const match = path.match(/\/([^/]+)\.md$/);
      return match ? match[1] : "";
    })
    .filter(Boolean);
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

export const loadChapterFile = async (slug: string): Promise<Chapter | null> => {
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

// ── Projects ─────────────────────────────────────────────────────────────────

export type ProjectMeta = {
  slug: string;
  title: string;
  logo: string;
  description?: string;
  [key: string]: any;
};

export type ProjectPost = {
  slug: string;
  title: string;
  date?: string;
  content: string;
  [key: string]: any;
};

export const getAvailableProjects = (): string[] => {
  const projects = new Set<string>();
  Object.keys(projectFiles).forEach((path) => {
    const match = path.match(/\/Projects\/([^/]+)\//);
    if (match) projects.add(match[1]);
  });
  return Array.from(projects);
};

export const loadProjectReadme = async (
  projectSlug: string,
): Promise<{ content: string; frontmatter: ProjectMeta } | null> => {
  const filePath = Object.keys(projectFiles).find((p) =>
    p.match(new RegExp(`/Projects/${projectSlug}/readme\\.md$`, "i")),
  );
  if (!filePath) return null;
  const { data, content } = parseFrontmatter(projectFiles[filePath] as string);
  return {
    content,
    frontmatter: {
      slug: projectSlug,
      title: data.title ?? projectSlug,
      logo: data.logo ?? "",
      ...data,
    },
  };
};

export const loadProjectPosts = async (
  projectSlug: string,
): Promise<ProjectPost[]> => {
  const relevant = Object.keys(projectFiles).filter(
    (p) =>
      p.includes(`/Projects/${projectSlug}/`) &&
      !p.match(/\/readme\.md$/i),
  );
  const posts: ProjectPost[] = [];
  for (const filePath of relevant) {
    const match = filePath.match(/\/([^/]+)\.md$/);
    if (!match) continue;
    const slug = match[1];
    const { data, content } = parseFrontmatter(
      projectFiles[filePath] as string,
    );
    posts.push({ slug, title: data.title ?? slug, date: data.date, content, ...data });
  }
  return posts.sort((a, b) => {
    if (a.date && b.date)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    return 0;
  });
};

export const getAllProjectsMeta = async (): Promise<ProjectMeta[]> => {
  const slugs = getAvailableProjects();
  const metas = await Promise.all(
    slugs.map(async (slug) => {
      const readme = await loadProjectReadme(slug);
      return readme ? readme.frontmatter : null;
    }),
  );
  return metas.filter(Boolean) as ProjectMeta[];
};

/**
 * Loads a specific devlog by project and slug
 */
export const loadDevLogFile = async (slug: string): Promise<DevLog | null> => {
  try {
    const filePath = `/src/Posts/DevLogs/${slug}.md`;
    const fileContent = devLogFiles[filePath];

    if (!fileContent) {
      console.error(`DevLog file not found: ${filePath}`);
      return null;
    }

    const { data, content } = parseFrontmatter(fileContent);

    return {
      slug,
      frontmatter: data as DevLogMeta,
      content,
    };
  } catch (error) {
    console.error(`Error loading devlog ${slug}:`, error);
    return null;
  }
};
