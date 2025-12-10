import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import '../styles/components/MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              className="code-block"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="markdown-paragraph">{children}</p>,
        h1: ({ children }) => <h1 className="markdown-heading markdown-h1">{children}</h1>,
        h2: ({ children }) => <h2 className="markdown-heading markdown-h2">{children}</h2>,
        h3: ({ children }) => <h3 className="markdown-heading markdown-h3">{children}</h3>,
        h4: ({ children }) => <h4 className="markdown-heading markdown-h4">{children}</h4>,
        ul: ({ children }) => <ul className="markdown-list markdown-ul">{children}</ul>,
        ol: ({ children }) => <ol className="markdown-list markdown-ol">{children}</ol>,
        li: ({ children }) => <li className="markdown-list-item">{children}</li>,
        blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="markdown-table-wrapper">
            <table className="markdown-table">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="markdown-table-head">{children}</thead>,
        tbody: ({ children }) => <tbody className="markdown-table-body">{children}</tbody>,
        tr: ({ children }) => <tr className="markdown-table-row">{children}</tr>,
        th: ({ children }) => <th className="markdown-table-header">{children}</th>,
        td: ({ children }) => <td className="markdown-table-cell">{children}</td>,
        hr: () => <hr className="markdown-hr" />,
        strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
        em: ({ children }) => <em className="markdown-em">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;

