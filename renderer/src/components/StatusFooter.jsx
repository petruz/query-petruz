import React from 'react';
import { FileDown, FileSpreadsheet, FileText, Image } from 'lucide-react';

const StatusFooter = ({
    executionTime,
    rowCount,
    onExportCSV,
    onExportExcel,
    onExportPDF,
    onExportChartImage,
    onExportChartPDF,
    hasResults,
    viewMode = 'grid'
}) => {
    return (
        <div className="flex items-center justify-between px-4 py-1 text-xs text-[var(--footer-text)] bg-[var(--footer-bg)] border-t border-[var(--footer-border)] h-full select-none">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--footer-text)] opacity-75">Execution Time:</span>
                    <span className="text-blue-400 font-mono">
                        {executionTime !== undefined ? `${executionTime} ms` : '-'}
                    </span>
                </div>
                <div className="h-3 w-px bg-[var(--footer-border)]"></div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--footer-text)] opacity-75">Rows:</span>
                    <span className="text-blue-400 font-mono">
                        {rowCount !== undefined ? rowCount : '-'}
                    </span>
                </div>
            </div>

            {/* Export Buttons */}
            {hasResults && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--footer-text)] opacity-75 mr-1">Export:</span>

                    {viewMode === 'grid' ? (
                        <>
                            <button
                                onClick={onExportCSV}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--footer-item-bg)] hover:bg-[var(--footer-item-hover)] border border-[var(--footer-border)] rounded transition-colors text-[var(--footer-item-text)]"
                                title="Export to CSV"
                            >
                                <FileDown size={12} />
                                CSV
                            </button>
                            <button
                                onClick={onExportExcel}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--footer-item-bg)] hover:bg-[var(--footer-item-hover)] border border-[var(--footer-border)] rounded transition-colors text-[var(--footer-item-text)]"
                                title="Export to Excel"
                            >
                                <FileSpreadsheet size={12} />
                                Excel
                            </button>
                            <button
                                onClick={onExportPDF}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--footer-item-bg)] hover:bg-[var(--footer-item-hover)] border border-[var(--footer-border)] rounded transition-colors text-[var(--footer-item-text)]"
                                title="Export to PDF"
                            >
                                <FileText size={12} />
                                PDF
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onExportChartPDF}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--footer-item-bg)] hover:bg-[var(--footer-item-hover)] border border-[var(--footer-border)] rounded transition-colors text-[var(--footer-item-text)]"
                                title="Export Chart to PDF"
                            >
                                <FileText size={12} />
                                PDF
                            </button>
                            <button
                                onClick={onExportChartImage}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--footer-item-bg)] hover:bg-[var(--footer-item-hover)] border border-[var(--footer-border)] rounded transition-colors text-[var(--footer-item-text)]"
                                title="Export Chart to Image"
                            >
                                <Image size={12} />
                                PNG
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatusFooter;

