type Chunk = {
  id: string;
  heading: string;
  text: string;
};

export function chunkByHeading(markdown: string): Chunk[] {
  const lines = markdown.split("\n");

  const chunks: Chunk[] = [];

  let currentHeading = "Introduction";
  let buffer: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##+\s+(.*)/);

    if (headingMatch) {
      if (buffer.length) {
        chunks.push({
          id: `${currentHeading}-${chunks.length}`,
          heading: currentHeading,
          text: buffer.join("\n").trim(),
        });
        buffer = [];
      }

      currentHeading = headingMatch[1];
    } else {
      buffer.push(line);
    }
  }

  if (buffer.length) {
    chunks.push({
      id: `${currentHeading}-${chunks.length}`,
      heading: currentHeading,
      text: buffer.join("\n").trim(),
    });
  }

  return chunks.filter((c) => c.text.length > 0);
}
