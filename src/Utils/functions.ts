import {
  BlogPostMeta,
  getAvailablePosts,
  loadMarkdownFile,
  loadMarkdownFileSync,
} from "./markdownLoader";

/**
 * Synchronous version of fetchBlogPosts — markdown is eager-bundled, so the list
 * is available on first render (used to seed state for prerender/first paint).
 */
export const getBlogPostsSync = (): BlogPostMeta[] => {
  const posts = getAvailablePosts()
    .map((slug) => {
      const post = loadMarkdownFileSync(slug);
      if (!post) return null;
      let image = post.frontmatter.image;
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
        // A review's own 1–10 verdict, which sizes its poster on the movie
        // wall. Undefined for everything that isn't scored.
        score: post.frontmatter.score,
      };
    })
    .filter((p) => p !== null) as BlogPostMeta[];

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

export const fetchBlogPosts = async (
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void,
  setPosts: (posts: BlogPostMeta[]) => void,
) => {
  try {
    const postSlugs = getAvailablePosts();

    if (postSlugs.length === 0) {
      setError("No blog post files found");
      setLoading(false);
      return;
    }

    const postPromises = postSlugs.map(async (slug) => {
      const post = await loadMarkdownFile(slug);
      if (!post) return null;

      // Extract first image from content if no featured image in frontmatter
      let image = post.frontmatter.image;
      if (!image) {
        const imgMatch = post.content.match(/<img.*?src=["'](.*?)["']/);
        image = imgMatch ? imgMatch[1] : undefined;
      }

      return {
        slug,
        title: post.frontmatter.title,
        date: post.frontmatter.date,
        image: image,
        tags: post.frontmatter.tags || "",
        description: post.frontmatter.description || "",
        score: post.frontmatter.score,
      };
    });

    const fetchedPosts = (await Promise.all(postPromises)).filter(
      (post) => post !== null,
    ) as BlogPostMeta[];

    if (fetchedPosts.length === 0) {
      setError("Could not load any posts. Check console for details.");
    }

    setPosts(
      fetchedPosts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
  } catch (err) {
    console.error("Failed to fetch blog posts", err);
    setError("Failed to fetch blog posts");
  } finally {
    setLoading(false);
  }
};
