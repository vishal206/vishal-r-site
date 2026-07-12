import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const baseUrl = "https://vishalr.dev";
const PORT = 4178;

// ── MIME types for the static server ─────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// ── Route enumeration (mirrors how the app resolves /archive/:slug) ──────────
const readSlugs = (dir) => {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
};

const frontmatterFor = (dirs, slug) => {
  for (const dir of dirs) {
    const file = path.join(root, dir, `${slug}.md`);
    if (fs.existsSync(file)) {
      const { data, content } = matter(fs.readFileSync(file, "utf8"));
      return { data, content };
    }
  }
  return { data: {}, content: "" };
};

const archiveDirs = [
  "src/Posts/BlogPosts",
  "src/Posts/About",
];

// Project write-ups live nested under src/Posts/Projects/<project>/<post>.md
// (the project's readme.md is a static overview, not an archive entry) but
// are reachable at /archive/:slug just like a regular blog post.
const readProjectPosts = () => {
  const projectsRoot = path.join(root, "src/Posts/Projects");
  if (!fs.existsSync(projectsRoot)) return [];
  const posts = [];
  for (const projectSlug of fs.readdirSync(projectsRoot)) {
    const projectDir = path.join(projectsRoot, projectSlug);
    if (!fs.statSync(projectDir).isDirectory()) continue;
    for (const file of fs.readdirSync(projectDir)) {
      if (!file.endsWith(".md") || file.toLowerCase() === "readme.md") continue;
      const { data, content } = matter(fs.readFileSync(path.join(projectDir, file), "utf8"));
      posts.push({ slug: file.replace(/\.md$/, ""), data, content });
    }
  }
  return posts;
};

const buildRoutes = () => {
  // NOTE: the home route ("/") is intentionally not prerendered — App.tsx loads
  // its data asynchronously, so a snapshot would not match the client's first
  // render (hydration flash). Leaving index.html as the clean SPA shell also
  // keeps it neutral as the rewrite fallback target.
  const routes = [
    { url: "/archive", out: "archive.html" },
    { url: "/books", out: "books.html" },
    { url: "/movies", out: "movies.html" },
    { url: "/about", out: "about.html" },
  ];

  const archiveSlugs = new Set();
  for (const dir of archiveDirs) readSlugs(dir).forEach((s) => archiveSlugs.add(s));

  for (const slug of archiveSlugs) {
    const { data, content } = frontmatterFor(archiveDirs, slug);
    routes.push({
      url: `/archive/${encodeURI(slug)}`,
      out: path.join("archive", `${slug}.html`),
      meta: metaFor(data, content, `/archive/${slug}`),
    });
  }

  for (const { slug, data, content } of readProjectPosts()) {
    if (archiveSlugs.has(slug)) continue;
    routes.push({
      url: `/archive/${encodeURI(slug)}`,
      out: path.join("archive", `${slug}.html`),
      meta: metaFor(data, content, `/archive/${slug}`),
    });
  }

  // Books each get a /book/<slug> reader page.
  for (const slug of readSlugs("src/Posts/Books")) {
    const { data, content } = frontmatterFor(["src/Posts/Books"], slug);
    routes.push({
      url: `/book/${encodeURI(slug)}`,
      out: path.join("book", `${slug}.html`),
      meta: metaFor({ ...data, image: data.cover }, content, `/book/${slug}`),
    });
  }
  return routes;
};

// ── Per-page <head> metadata derived from frontmatter ────────────────────────
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const excerpt = (content) =>
  content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_`~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

const metaFor = (data, content, urlPath) => {
  const title = data.title ? `${data.title} · Vishal R` : "Vishal R";
  const description = data.description || excerpt(content) || "Blogs and DevLogs from Vishal R";
  const url = `${baseUrl}${urlPath}`;
  // Posts without their own image fall back to the branded logo card.
  return { title, description, url, image: data.image || data.banner || "/og-default.png" };
};

const injectHead = (html, meta) => {
  if (!meta) return html;
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image.startsWith("http") ? meta.image : baseUrl + meta.image)}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
  ]
    .filter(Boolean)
    .join("\n    ");

  // Strip the shell's <title> and the home-page OG/description tags, then inject
  // this page's own — otherwise posts would inherit the home title/image.
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+name="description"[^>]*>/gi, "")
    .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/\s*<!--\s*Open Graph[^>]*-->/gi, "")
    .replace(/<\/head>/i, `    ${tags}\n  </head>`);
};

// ── Static file server with SPA fallback to the original shell ───────────────
const startServer = (shell) =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(distDir, urlPath);
      if (path.extname(filePath) && fs.existsSync(filePath)) {
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
      } else {
        // Unknown route -> serve the SPA shell so React Router can render it.
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(shell);
      }
    });
    server.listen(PORT, () => resolve(server));
  });

// ── Main ─────────────────────────────────────────────────────────────────────
const run = async () => {
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    console.error("dist/index.html not found — run `vite build` first.");
    process.exit(1);
  }

  // Capture the clean shell up front so renders always boot from it, even after
  // we start writing prerendered files into dist.
  const shell = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  const routes = buildRoutes();
  const server = await startServer(shell);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = [];
  let ok = 0;
  let failed = 0;

  for (const route of routes) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      window.__PRERENDER__ = true;
    });
    try {
      await page.goto(`http://localhost:${PORT}${route.url}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      // Wait until the SPA has rendered real content into #root.
      await page.waitForFunction(
        () => {
          const r = document.getElementById("root");
          if (!r) return false;
          const t = (r.innerText || "").trim();
          return t.length > 50 && !/^Loading…?$/.test(t);
        },
        { timeout: 25000 },
      );
      await new Promise((r) => setTimeout(r, 400)); // settle markdown/images

      const html = await page.content();
      results.push({ out: route.out, html: injectHead(html, route.meta) });
      ok++;
      console.log(`  ✓ ${route.url}`);
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${route.url} — ${err.message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  // Write everything only after all renders succeed-or-skip, so a mid-run
  // failure never leaves dist half-written.
  for (const { out, html } of results) {
    const dest = path.join(distDir, out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, html);
  }

  console.log(`Prerendered ${ok} route(s)${failed ? `, ${failed} skipped` : ""}.`);
  // Skipped routes simply fall back to the SPA shell via Firebase rewrites — no
  // regression — so don't fail the build for them.
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
