/**
 * MarkdownRenderer Component
 * Renders markdown content with support for syntax highlighting and GitHub-Flavored Markdown (GFM).
 * 
 * @component
 * @param {object} props - Component props
 * @param {string} props.content - Markdown content to render
 */
import React from 'react'; // Core React library
import ReactMarkdown from 'react-markdown'; // Library to render markdown as React components
import remarkGfm from 'remark-gfm'; // Plugin for GitHub-Flavored Markdown (GFM), supporting tables, strikethroughs, etc.
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // Syntax highlighter for code blocks
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Theme for syntax highlighting

/**
 * MarkdownRenderer Component
 * - Utilizes `ReactMarkdown` for rendering markdown.
 * - Supports GitHub-Flavored Markdown (GFM) with the `remark-gfm` plugin.
 * - Implements syntax highlighting for code blocks using `react-syntax-highlighter`.
 *
 * @param {string} content - Markdown content to be rendered.
 */
const MarkdownRenderer = ({ content }) => {
  return (
    /**
     * ReactMarkdown component renders markdown content as React elements.
     * - `remarkPlugins`: Configures plugins like `remark-gfm` for additional markdown features.
     * - `components`: Customizes the rendering of specific markdown elements (e.g., `code` blocks, paragraphs).
     */
    <ReactMarkdown
      remarkPlugins={[remarkGfm]} // Enable GitHub-flavored Markdown
      components={{
         /**
         * Custom rendering for `code` blocks:
         * - Uses `react-syntax-highlighter` for syntax highlighting of code blocks.
         * - Matches the language from the `className` (e.g., `language-js` for JavaScript).
         * - If inline code, renders it within a `<code>` tag without highlighting.
         *
         * @param {object} params - Props passed to the code block.
         * @param {boolean} params.inline - Indicates whether the code block is inline.
         * @param {string} params.className - Class name of the code block (used to determine language).
         * @param {Array} params.children - Child nodes (actual code content).
         */
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark} // Syntax highlighting theme
              language={match[1]} // Language for syntax highlighting (e.g., `javascript`, `python`)
              PreTag="div" // Wrapper tag for the highlighted code block
              {...props} // Spread additional props
            >
              {String(children).replace(/\n$/, '')} {/* Render code content */}
            </SyntaxHighlighter>
          ) : (
            <code
              className={className}
              {...props}
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                background: '#f5f5f5',
                padding: '2px 4px',
                borderRadius: '4px',
                lineHeight: '1.6',
                fontSize: '16px',
              }}
            >
              {children}
            </code>
          );
        },
        /**
         * Custom rendering for `p` (paragraph) elements:
         * - Adds consistent margin and font size for paragraphs.
         *
         * @param {object} params - Props passed to the paragraph element.
         * @param {Array} params.children - Child nodes (text content).
         */
        p({ children }) {
          return (
            <p
              style={{
                margin: '8px 0', // Adjust top and bottom margin
                fontSize: '16px', // Font size for readability
                lineHeight: '1.6', // Adjust line height for better spacing
              }}
            >
              {children}
            </p>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer; // Export the component for use in other parts of the application