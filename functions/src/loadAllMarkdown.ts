import fs from "fs";
import path from "path";

export type MarkdownDoc = {
  filePath: string;
  relativePath: string;
};

export function loadAllMarkdownFiles(rootDir: string): MarkdownDoc[] {
  const results: MarkdownDoc[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push({
          filePath: fullPath,
          relativePath: path.relative(rootDir, fullPath),
        });
      }
    }
  }

  walk(rootDir);
  return results;
}
