export type SectionId = "movies" | "books" | "projects" | "blog";

export const SECTION_TO_PATH: Record<SectionId, string> = {
  movies: "/movies",
  books: "/books",
  projects: "/projects",
  blog: "/archive",
};

export const PATH_TO_SECTION: Record<string, SectionId> = {
  "/movies": "movies",
  "/books": "books",
  "/projects": "projects",
  "/archive": "blog",
};

export const SECTION_LABELS: Record<SectionId, string> = {
  movies: "Movies",
  books: "Books",
  projects: "Projects",
  blog: "Blog",
};

export const SECTION_ORDER: SectionId[] = ["movies", "books", "projects", "blog"];
