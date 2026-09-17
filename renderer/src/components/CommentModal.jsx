import React, { useEffect, useRef, useState } from 'react';

const CommentModal = ({ initialValue, onSave, onCancel }) => {
    const [value, setValue] = useState(initialValue || '');
    const textareaRef = useRef(null);

    useEffect(() => textareaRef.current?.focus(), []);

    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-[36rem] max-w-[90vw]">
                <div className="p-5 border-b border-modal-border">
                    <h2 className="text-lg font-bold text-modal-text">Query comment</h2>
                </div>
                <div className="p-5">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder="Write a Markdown comment for this query"
                        className="w-full h-56 resize-y bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
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