import React from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';

const SettingsModal = ({ settings, onUpdateSettings, onClose }) => {
    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-[32rem] max-w-[90vw] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-modal-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SettingsIcon size={18} className="text-blue-400" />
                        <h2 className="text-lg font-bold text-modal-text">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-modal-text-muted hover:text-modal-text transition-colors p-1 rounded"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">
                    {/* Section: File Export */}
                    <div>
                        <h3 className="text-xs font-semibold text-modal-text-muted uppercase tracking-wider mb-3">
                            File Export
                        </h3>
                        <div className="bg-modal-input-bg border border-modal-input-border rounded-lg p-4">
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={Boolean(settings.normalizeExportFileName)}
                                    onChange={(e) => onUpdateSettings({ normalizeExportFileName: e.target.checked })}
                                    className="mt-0.5 rounded border-modal-border bg-modal-bg text-blue-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer accent-blue-600"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-modal-text">
                                        Normalize export file names
                                    </span>
                                    <span className="text-xs text-modal-text-muted mt-0.5 leading-relaxed">
                                        Converts proposed file names to lowercase and replaces spaces with underscores (e.g. <code className="font-mono text-[11px] text-blue-400">my_query_name.csv</code>). If unchecked, the original query name is preserved as-is.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-modal-bg border-t border-modal-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-modal-button-primary-bg hover:bg-modal-button-primary-hover text-modal-button-text rounded text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
