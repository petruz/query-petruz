import React from 'react';

const AboutModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-96 p-6">
                <h2 className="text-2xl font-bold text-modal-text mb-4 text-center">Query Mole</h2>

                <div className="space-y-3 text-modal-text-secondary text-sm">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🦫</div>
                    </div>

                    <div className="border-t border-modal-border pt-3 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-modal-text-muted">Version:</span>
                            <span className="font-mono">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-modal-text-muted">Year:</span>
                            <span>{new Date().getFullYear()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-modal-text-muted">License:</span>
                            <span>MIT</span>
                        </div>
                    </div>

                    <div className="border-t border-modal-border pt-3">
                        <p className="text-modal-text-muted text-xs text-center">
                            A database diagnostic tool for executing raw SQL queries, analyzing performance, and managing query libraries.
                        </p>
                    </div>

                    <div className="border-t border-modal-border pt-3">
                        <div className="text-center">
                            <a
                                href="https://github.com/petruz/query-mole"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-modal-link hover:text-modal-link-hover text-xs"
                            >
                                github.com/petruz/query-mole
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-modal-button-primary-bg hover:bg-modal-button-primary-hover text-modal-button-text border border-modal-button-primary-bg rounded text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
