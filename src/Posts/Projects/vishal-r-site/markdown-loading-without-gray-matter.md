---
title: "Markdown Loading Without gray-matter"
date: "2025-12-20"
---

## The Problem

The standard library for parsing YAML frontmatter in markdown is `gray-matter`. It works great in Node.js. In the browser, it throws:

```
ReferenceError: Buffer is not defined
```

Vite doesn't polyfill Node's `Buffer` by default in browser builds, and gray-matter relies on it.

## The Solution

A 30-line custom parser using regex:

```typescript
const parseFrontmatter = (markdown: string) => {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = markdown.match(frontmatterRegex);
  if (!match) return { data: {}, content: markdown };

  const frontmatter = match[1];
  const content = markdown.replace(frontmatterRegex, "").trim();

  const data: Record<string, any> = {};
  frontmatter.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length) {
      let value = valueParts.join(":").trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      data[key.trim()] = value;
    }
  });

  return { data, content };
};
```

It handles the 90% case — string values, quoted strings, colons in values. It doesn't handle nested YAML objects or arrays, but none of the frontmatter fields I use need that.

## Loading with Vite Glob

`import.meta.glob` bundles all markdown files at build time:

```typescript
const blogPostFiles = import.meta.glob("/src/Posts/BlogPosts/*.md", {
  eager: true,
  as: "raw",
});
```

The `eager: true` means all files are bundled synchronously, and `as: "raw"` gives the raw string content instead of a module. This means no async loading on first render — the content is already in the bundle.
