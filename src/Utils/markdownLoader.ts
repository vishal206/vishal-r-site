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
const blogPostFiles = import.meta.glob('/src/Posts/BlogPosts/*.md', { eager: true, as: 'raw' });

/**
 * Gets all available blog posts
 */
export const getAvailablePosts = (): string[] => {
  return Object.keys(blogPostFiles).map(path => {
    // Extract slug from path (e.g., '/src/Posts/BlogPosts/my-first-post.md' -> 'my-first-post')
    const match = path.match(/\/([^/]+)\.md$/);
    return match ? match[1] : '';
  }).filter(Boolean);
};

/**
 * Simple frontmatter parser for browser environment
 * This avoids the Buffer not defined error from gray-matter
 */
const parseFrontmatter = (markdown: string): { data: Record<string, any>; content: string } => {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = markdown.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content: markdown };
  }
  
  const frontmatter = match[1];
  const content = markdown.replace(frontmatterRegex, '').trim();
  
  // Parse the frontmatter
  const data: Record<string, any> = {};
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      // Join the value parts back together in case the value itself contained colons
      let value = valueParts.join(':').trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
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
export const loadMarkdownFile = async (slug: string): Promise<BlogPost | null> => {
  try {
    // Find the file path that matches the slug
    const filePath = Object.keys(blogPostFiles).find(path => path.includes(`/${slug}.md`));
    
    if (!filePath) {
      console.error(`No file found for slug: ${slug}`);
      return null;
    }
    
    // Get the raw content
    const rawContent = blogPostFiles[filePath] as string;
    
    // Parse frontmatter with our custom parser instead of gray-matter
    const { data, content } = parseFrontmatter(rawContent);
    
    // Ensure the frontmatter has the required properties
    const frontmatter: BlogPostMeta = {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      ...data
    };
    
    return {
      slug,
      frontmatter,
      content
    };
  } catch (err) {
    console.error(`Error loading markdown file ${slug}:`, err);
    return null;
  }
};

// Add WeekNotes support
const weekNotesFiles = import.meta.glob('/src/Posts/WeekNotes/*.md', { eager: true, as: 'raw' });

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
  return Object.keys(weekNotesFiles).map(path => {
    const match = path.match(/\/([^/]+)\.md$/);
    return match ? match[1] : '';
  }).filter(Boolean);
};

/**
 * Loads a specific week note by slug
 */
export const loadWeekNoteFile = async (slug: string): Promise<WeekNote | null> => {
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
      content
    };
  } catch (error) {
    console.error(`Error loading week note ${slug}:`, error);
    return null;
  }
};

// Add DevLogs support
const devLogFiles = import.meta.glob('/src/Posts/DevLogs/**/*.md', { eager: true, as: 'raw' });

export type DevLogMeta = {
  slug: string;
  title: string;
  date: string;
  project: string;
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
export const getAvailableDevLogProjects = (): string[] => {
  const projects = new Set<string>();
  Object.keys(devLogFiles).forEach(path => {
    const match = path.match(/\/DevLogs\/([^/]+)\//);
    if (match) {
      projects.add(match[1]);
    }
  });
  return Array.from(projects);
};

/**
 * Gets all devlogs for a specific project
 */
export const getDevLogsByProject = (project: string): string[] => {
  return Object.keys(devLogFiles)
    .filter(path => path.includes(`/DevLogs/${project}/`))
    .map(path => {
      const match = path.match(/\/([^/]+)\.md$/);
      return match ? match[1] : '';
    })
    .filter(Boolean);
};

/**
 * Loads a specific devlog by project and slug
 */
export const loadDevLogFile = async (project: string, slug: string): Promise<DevLog | null> => {
  try {
    const filePath = `/src/Posts/DevLogs/${project}/${slug}.md`;
    const fileContent = devLogFiles[filePath];
    
    if (!fileContent) {
      console.error(`DevLog file not found: ${filePath}`);
      return null;
    }

    const { data, content } = parseFrontmatter(fileContent);
    
    return {
      slug,
      frontmatter: data as DevLogMeta,
      content
    };
  } catch (error) {
    console.error(`Error loading devlog ${project}/${slug}:`, error);
    return null;
  }
};
