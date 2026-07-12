// Shared "On This Page" table of contents for posts marked `isContextTable`.
// Rendered in a reader's right rail (see ReaderShell). Numbers headings
// hierarchically: 1, 2 for h1; 1.1, 1.2 for h2; 1.1.1 for h3.

interface TocHeading {
  level: number;
  text: string;
  id: string;
}

export const extractHeadings = (content: string): TocHeading[] => {
  return content
    .split("\n")
    .filter((line) => /^#{1,3}\s/.test(line))
    .map((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (!match) return null;
      const text = match[2].trim();
      return {
        level: match[1].length,
        text,
        id: text
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "-"),
      };
    })
    .filter(Boolean) as TocHeading[];
};

const ContextToc = ({ content }: { content: string }) => {
  const headings = extractHeadings(content);
  if (headings.length === 0) return null;

  const counters = [0, 0, 0];
  const numbered = headings.map((h) => {
    const idx = h.level - 1;
    counters[idx]++;
    for (let i = idx + 1; i < 3; i++) counters[i] = 0;
    const number = counters.slice(0, idx + 1).join(".");
    return { ...h, number };
  });

  return (
    <div className="sticky top-0">
      <div className="text-[9px] uppercase tracking-[0.22em] text-editorial-label mb-5">
        On This Page
      </div>
      <nav className="flex flex-col gap-1">
        {numbered.map((h, i) => (
          <a
            key={i}
            href={`#${h.id}`}
            className={`flex gap-2 py-1 text-editorial-label hover:text-editorial-text transition-colors leading-snug ${
              h.level === 1
                ? "text-[11px] font-semibold pl-0"
                : h.level === 2
                  ? "text-[10px] pl-2"
                  : "text-[9px] pl-4 opacity-80"
            }`}
          >
            <span className="shrink-0 text-editorial-label opacity-50">
              {h.number}
            </span>
            <span>{h.text}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default ContextToc;
