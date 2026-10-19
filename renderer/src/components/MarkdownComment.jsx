import React from 'react';
import ReactMarkdown from 'react-markdown';

const markdownComponents = {
    p: ({ _node, ...props }) => <p className="mb-1.5 last:mb-0 leading-relaxed text-gray-200" {...props} />,
    strong: ({ _node, ...props }) => <strong className="font-bold text-white" {...props} />,
    b: ({ _node, ...props }) => <b className="font-bold text-white" {...props} />,
    em: ({ _node, ...props }) => <em className="italic text-gray-300" {...props} />,
    i: ({ _node, ...props }) => <i className="italic text-gray-300" {...props} />,
    code: ({ _node, _inline, ...props }) => (
        <code className="bg-gray-800 text-amber-300 px-1 py-0.5 rounded text-[11px] font-mono border border-gray-700" {...props} />
    ),
    pre: ({ _node, ...props }) => (
        <pre className="bg-gray-800 p-2 rounded text-[11px] font-mono overflow-x-auto my-1.5 border border-gray-700" {...props} />
    ),
    ul: ({ _node, ...props }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5 text-gray-200" {...props} />,
    ol: ({ _node, ...props }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5 text-gray-200" {...props} />,
    li: ({ _node, ...props }) => <li className="leading-relaxed" {...props} />,
    h1: ({ _node, ...props }) => <h1 className="text-sm font-bold text-white border-b border-gray-700 pb-0.5 mb-1" {...props} />,
    h2: ({ _node, ...props }) => <h2 className="text-xs font-bold text-white mb-1" {...props} />,
    h3: ({ _node, ...props }) => <h3 className="text-xs font-semibold text-gray-300 mb-0.5" {...props} />,
    blockquote: ({ _node, ...props }) => (
        <blockquote className="border-l-2 border-blue-400 pl-2 italic text-gray-300 my-1" {...props} />
    ),
    a: ({ _node, ...props }) => (
        <a className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noreferrer" {...props} />
    ),
    hr: () => <hr className="border-gray-700 my-1.5" />
};

const MarkdownComment = ({ content, className = '' }) => {
    if (!content) return null;
    return (
        <div className={`font-normal text-xs text-gray-200 ${className}`}>
            <ReactMarkdown components={markdownComponents}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownComment;
