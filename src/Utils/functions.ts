import {
  BlogPostMeta,
  getAvailablePosts,
  loadMarkdownFileSync,
} from "./markdownLoader";

/**
 * Every blog post, newest first. Markdown is eager-bundled, so the list is
 * available synchronously on first render.
 */
export const getBlogPostsSync = (): BlogPostMeta[] => {
  const posts = getAvailablePosts()
    .map((slug) => {
      const post = loadMarkdownFileSync(slug);
      if (!post) return null;
      let image = post.frontmatter.banner;
      if (!image) {
        const imgMatch = post.content.match(/<img.*?src=["'](.*?)["']/);
        image = imgMatch ? imgMatch[1] : undefined;
      }
      return {
        slug,
        title: post.frontmatter.title,
        date: post.frontmatter.date,
        image,
        tags: post.frontmatter.tags || "",
        description: post.frontmatter.description || "",
      };
    })
    .filter((p) => p !== null) as BlogPostMeta[];

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};
