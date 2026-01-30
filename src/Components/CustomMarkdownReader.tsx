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
        h1: ({ node, ...props }) => (
          <h1
            className="text-2xl md:text-3xl font-serif font-light mt-10 mb-4"
            {...props}
          />
        ),
        h2: ({ node, ...props }) => (
          <h2
            className="text-xl md:text-2xl font-serif font-light mt-8 mb-3"
            {...props}
          />
        ),
        h3: ({ node, ...props }) => (
          <h3
            className="text-lg md:text-xl font-serif font-light mt-6 mb-2"
            {...props}
          />
        ),
        p: ({ node, ...props }) => (
          <p className="mb-6 leading-relaxed font-light" {...props} />
        ),
        img: ({ node, ...props }) => (
          <img
            {...props}
            className="max-w-full h-auto rounded-lg"
            alt={props.alt || "image"}
          />
        ),
        a: (props) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 border-b border-gray-300 hover:border-gray-700 transition-colors"
          >
            {props.children}
          </a>
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-bold" {...props} />
        ),
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-6 mb-6" {...props} />
        ),
        li: ({ node, ...props }) => <li className="mb-2" {...props} />,
      }}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
    >
      {content}
    </ReactMarkdown>
  );
};
