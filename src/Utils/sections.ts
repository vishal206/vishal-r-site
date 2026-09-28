export type SectionId = "blog";

export const SECTION_TO_PATH: Record<SectionId, string> = {
  blog: "/archive",
};

export const PATH_TO_SECTION: Record<string, SectionId> = {
  "/archive": "blog",
};

export const SECTION_LABELS: Record<SectionId, string> = {
  blog: "Blog",
};

export const SECTION_ORDER: SectionId[] = ["blog"];
