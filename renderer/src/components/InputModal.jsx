import React, { useState, useEffect, useRef } from 'react';

const InputModal = ({ title, initialValue, onConfirm, onCancel }) => {
    const [value, setValue] = useState(initialValue || '');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(value);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 w-80">
                <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 mb-4"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InputModal;
