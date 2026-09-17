import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, onClose, onRename, onDelete, onAddQuery, onAddFolder, onEditComment, onConfigureChart, type }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1 min-w-[150px]"
            style={{ top: y, left: x }}
        >
            <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={onRename}
            >
                Rename
            </button>
            {type === 'QUERY' && (
                <>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={onEditComment}
                    >
                        Edit Comment
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={onConfigureChart}
                    >
                        Configure Chart
                    </button>
                </>
            )}
            {type === 'FOLDER' && (
                <>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={onAddQuery}
                    >
                        Add Query
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={onAddFolder}
                    >
                        Add Folder
                    </button>
                </>
            )}
            <button
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                onClick={onDelete}
            >
                Delete
            </button>
        </div>
    );
};

export default ContextMenu;
