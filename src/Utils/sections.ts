export type SectionId = "projects" | "blog";

export const SECTION_TO_PATH: Record<SectionId, string> = {
  projects: "/projects",
  blog: "/archive",
};

export const PATH_TO_SECTION: Record<string, SectionId> = {
  "/projects": "projects",
  "/archive": "blog",
};

export const SECTION_LABELS: Record<SectionId, string> = {
  projects: "Projects",
  blog: "Blog",
};

export const SECTION_ORDER: SectionId[] = ["projects", "blog"];
