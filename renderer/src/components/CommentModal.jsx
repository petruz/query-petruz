import React, { useEffect, useRef, useState } from 'react';
import MarkdownComment from './MarkdownComment';

const CommentModal = ({ initialValue, onSave, onCancel }) => {
    const [value, setValue] = useState(initialValue || '');
    const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
    const textareaRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'write') textareaRef.current?.focus();
    }, [activeTab]);

    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-[36rem] max-w-[90vw]">
                <div className="p-4 border-b border-modal-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-modal-text">Query comment</h2>
                    <div className="flex bg-modal-input-bg border border-modal-input-border rounded p-0.5 text-xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('write')}
                            className={`px-3 py-1 rounded transition-colors ${activeTab === 'write' ? 'bg-blue-600 text-white font-medium' : 'text-modal-text-secondary hover:text-modal-text'}`}
                        >
                            Write
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={`px-3 py-1 rounded transition-colors ${activeTab === 'preview' ? 'bg-blue-600 text-white font-medium' : 'text-modal-text-secondary hover:text-modal-text'}`}
                        >
                            Preview
                        </button>
                    </div>
                </div>
                <div className="p-5">
                    {activeTab === 'write' ? (
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            placeholder="Write a Markdown comment for this query (e.g. **bold**, *italic*, lists, code)"
                            className="w-full h-56 resize-y bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                    ) : (
                        <div className="w-full h-56 overflow-y-auto bg-modal-input-bg border border-modal-input-border rounded p-3">
                            {value.trim() ? (
                                <MarkdownComment content={value} />
                            ) : (
                                <span className="text-modal-text-secondary italic text-xs">No comment text to preview.</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-5 pt-0 flex justify-end gap-2">
                    <button onClick={onCancel} className="px-3 py-1.5 text-sm text-modal-text-secondary hover:text-modal-text">Cancel</button>
                    <button onClick={() => onSave(value)} className="px-3 py-1.5 text-sm bg-modal-button-primary-bg hover:bg-modal-button-primary-hover text-modal-button-text rounded">Save</button>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;