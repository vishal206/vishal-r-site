export type SectionId = "blog";

export const SECTION_TO_PATH: Record<SectionId, string> = {
  blog: "/archive",
};

export const PATH_TO_SECTION: Record<string, SectionId> = {
  "/archive": "blog",
};
