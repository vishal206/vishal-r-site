// Article classifications. The nav's Articles dropdown links to
// /archive?tag=<tag>, and the Articles page filters on that param.
export const ARTICLE_TAGS = ["Devlog", "Life", "Movie", "Book"];

// The tag an /archive URL is showing, lowercased; a bare /archive shows the
// first tag.
export const tagFromParam = (param: string | null) =>
  (param ?? ARTICLE_TAGS[0]).toLowerCase();
