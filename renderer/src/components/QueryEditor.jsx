import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-dark.css'; // Importing a dark theme

const QueryEditor = ({ value, onChange }) => {
    return (
        <div className="w-full h-full bg-editor-bg overflow-auto font-mono text-sm">
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={code => highlight(code, languages.sql, 'sql')}
                padding={16}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    backgroundColor: 'var(--editor-bg)',
                    color: 'var(--editor-text)',
                    minHeight: '100%',
                }}
                textareaClassName="focus:outline-none"
            />
        </div>
    );
};

export default QueryEditor;
