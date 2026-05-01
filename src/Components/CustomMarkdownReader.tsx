import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type MarkdownReaderProps = {
  content: string;
};

export const CustomMarkdownReader = ({ content }: MarkdownReaderProps) => {
  return (
    <ReactMarkdown
      components={{
        h1: ({ node, children, ...props }) => {
          const text = typeof children === "string" ? children : "";
          const id = text
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, "-");
          return (
            <h1
              id={id}
              className="font-display text-2xl md:text-3xl font-bold text-editorial-text mt-10 mb-4 leading-tight scroll-mt-8"
              {...props}
            >
              {children}
            </h1>
          );
        },
        h2: ({ node, children, ...props }) => {
          const text = typeof children === "string" ? children : "";
          const id = text
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, "-");
          return (
            <h2
              id={id}
              className="font-display text-xl md:text-2xl font-bold text-editorial-text mt-8 mb-3 leading-tight scroll-mt-8"
              {...props}
            >
              {children}
            </h2>
          );
        },
        h3: ({ node, children, ...props }) => {
          const text = typeof children === "string" ? children : "";
          const id = text
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, "-");
          return (
            <h3
              id={id}
              className="font-display text-lg md:text-xl font-bold text-editorial-text mt-6 mb-2 scroll-mt-8"
              {...props}
            >
              {children}
            </h3>
          );
        },
        p: ({ node, ...props }) => (
          <p
            className="mb-6 leading-[1.85] text-editorial-muted text-base md:text-[1.1rem] font-body font-normal"
            {...props}
          />
        ),
        img: ({ node, ...props }) => (
          <img
            {...props}
            className="max-w-full h-auto my-6"
            alt={props.alt || ""}
          />
        ),
        a: (props) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-editorial-text border-b border-editorial-divider hover:border-editorial-text transition-colors"
          >
            {props.children}
          </a>
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-semibold text-editorial-text" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-editorial-muted" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul
            className="list-disc pl-6 mb-6 space-y-2 text-editorial-muted font-body"
            {...props}
          />
        ),
        ol: ({ node, ...props }) => (
          <ol
            className="list-decimal pl-6 mb-6 space-y-2 text-editorial-muted font-body"
            {...props}
          />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-relaxed font-body" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-2 border-available pl-6 my-8 font-body italic text-xl text-editorial-text"
            {...props}
          />
        ),
        hr: ({ node, ...props }) => (
          <hr className="border-editorial-divider my-10" {...props} />
        ),
        code: ({ node, ...props }) => (
          <code
            className="bg-editorial-divider text-editorial-text text-sm px-1.5 py-0.5 font-mono"
            {...props}
          />
        ),
        pre: ({ node, ...props }) => (
          <pre
            className="bg-editorial-divider text-editorial-text text-sm p-5 my-6 overflow-x-auto font-mono leading-relaxed"
            {...props}
          />
        ),
      }}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
    >
      {content}
    </ReactMarkdown>
  );
};
