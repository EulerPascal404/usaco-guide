import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import CodeBlock from '../markdown/CodeBlock/CodeBlock';

const GroupsCodeBlock = ({ language, value }) => {
  return <CodeBlock className={`language-${language}`}>{value}</CodeBlock>;
};

const renderers = {
  code: GroupsCodeBlock,
};

export default function SafeMarkdownRenderer({ children }) {
  return (
    <div className="prose dark:prose-light max-w-none">
      <ReactMarkdown renderers={renderers} plugins={[gfm]} linkTarget="_blank">
        {children}
      </ReactMarkdown>
    </div>
  );
}
