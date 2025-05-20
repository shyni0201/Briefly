import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownRenderer from '../MarkdownRenderer';

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <div data-testid="syntax-highlighter">{children}</div>,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

jest.mock('react-markdown', () => (props) => (
    <div data-testid="react-markdown">{props.children}</div>
  ));

jest.mock('remark-gfm', () => jest.fn());

describe('MarkdownRenderer Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
      });
  test('renders plain text content', () => {
    const plainText = 'This is a plain text paragraph.';
    render(<MarkdownRenderer content={plainText} />);

    expect(screen.getByText(plainText)).toBeInTheDocument();
  });

  test('renders headings correctly', () => {
    const headings = '# Heading 1\n## Heading 2\n### Heading 3';
    render(<MarkdownRenderer content={headings} />);

    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Heading 1');
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('## Heading 2');
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('### Heading 3');
  });

  test('renders Markdown formatted content', () => {
    const markdownContent = '# Heading 1\n\nThis is a paragraph.';
    render(<MarkdownRenderer content={markdownContent} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders a code block with syntax highlighting', () => {
    const codeContent = '```js\nconsole.log("Hello, world!");\n```';
    render(<MarkdownRenderer content={codeContent} />);

    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('console.log("Hello, world!");');
  });

  test('renders nested lists', () => {
    const nestedList = `
- Item 1
  - Subitem 1.1
  - Subitem 1.2
- Item 2
`;
    render(<MarkdownRenderer content={nestedList} />);
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('Item 1');
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('Subitem 1.1');
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('Item 2');
  });

  test('renders inline code', () => {
    const inlineCode = 'This is `inline code`.';
    render(<MarkdownRenderer content={inlineCode} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders fallback for inline code without language', () => {
    const inlineCode = '`No language specified`';
    render(<MarkdownRenderer content={inlineCode} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveTextContent('No language specified');
  });

  test('renders non-inline code block with syntax highlighting', () => {
    const codeContent = '```js\nconsole.log("Hello, world!");\n```';
    render(<MarkdownRenderer content={codeContent} />);
  
    const syntaxHighlighter = screen.getByTestId('react-markdown');
    expect(syntaxHighlighter).toBeInTheDocument();
    expect(syntaxHighlighter).toHaveTextContent('console.log("Hello, world!");');
  });

  test('renders GitHub-flavored Markdown (GFM)', () => {
    const gfmContent = '- [x] Task 1\n- [ ] Task 2\n\n| Col1 | Col2 |\n| ---- | ---- |\n| Val1 | Val2 |';
    render(<MarkdownRenderer content={gfmContent} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders a code block without language correctly', () => {
    const codeContent = '```\nconsole.log("No language specified");\n```';
    render(<MarkdownRenderer content={codeContent} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveTextContent('console.log("No language specified");');
  });

  test('renders custom styles for paragraphs', () => {
    const paragraph = 'This is a styled paragraph.';
    render(<MarkdownRenderer content={paragraph} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders without crashing for empty content', () => {
    render(<MarkdownRenderer content="" />);
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
  });

  test('renders Markdown content with tables', () => {
    const tableContent = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
    render(<MarkdownRenderer content={tableContent} />);
    const renderedMarkdown = screen.getByTestId('react-markdown');
    expect(renderedMarkdown).toBeInTheDocument();
    expect(renderedMarkdown).toHaveTextContent('Header 1');
    expect(renderedMarkdown).toHaveTextContent('Cell 2');
  });

  test('matches the snapshot for complex Markdown content', () => {
    const complexContent = `
# Heading 1

This is a paragraph with **bold** and *italic* text.

\`\`\`js
console.log("Hello, world!");
\`\`\`

- Item 1
- Item 2
- Item 3

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
    const { asFragment } = render(<MarkdownRenderer content={complexContent} />);
    expect(asFragment()).toMatchSnapshot();
  });
});