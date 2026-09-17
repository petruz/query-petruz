import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResultsTable = forwardRef(({ results, loading, filterText = '' }, ref) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    // Reset pagination when results or filter change
    React.useEffect(() => {
        setCurrentPage(1);
        setSortConfig({ key: null, direction: 'asc' });
    }, [results, filterText]);

    const sortedRows = useMemo(() => {
        if (!results || !results.rows) return [];

        let sortableRows = [...results.rows];

        // Apply filter if filterText is provided
        if (filterText && filterText.trim() !== '') {
            const lowerFilter = filterText.toLowerCase();
            sortableRows = sortableRows.filter(row => {
                // Check if any column value contains the filter text
                return results.columns.some(col => {
                    const value = row[col];
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(lowerFilter);
                });
            });
        }

        // Apply sorting
        if (sortConfig.key !== null) {
            sortableRows.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null) return 1;
                if (bValue === null) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableRows;
    }, [results, sortConfig, filterText]);

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return sortedRows.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedRows, currentPage]);

    const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Export Functions
    const exportToCSV = async () => {
        if (!results || !results.rows) return;

        // Create CSV content
        const headers = results.columns.join(',');
        const rows = sortedRows.map(row => {
            return results.columns.map(col => {
                const value = row[col];
                if (value === null || value === undefined) return '';
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',');
        }).join('\n');

        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Save file
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'query-results.csv',
                    types: [{
                        description: 'CSV Files',
                        accept: { 'text/csv': ['.csv'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                // Fallback
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'query-results.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to save CSV:', err);
            }
        }
    };

    const exportToExcel = async () => {
        if (!results || !results.rows) return;

        // Create worksheet data
        const data = [
            results.columns, // Header row
            ...sortedRows.map(row => results.columns.map(col => row[col] ?? ''))
        ];

        // Create workbook
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Auto-size columns
        const colWidths = results.columns.map((col, i) => {
            const maxLength = Math.max(
                col.length,
                ...sortedRows.map(row => String(row[col] ?? '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Query Results');

        // Save file
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'query-results.xlsx',
                    types: [{
                        description: 'Excel Files',
                        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
                    }],
                });
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const writable = await handle.createWritable();
                await writable.write(new Blob([wbout], { type: 'application/octet-stream' }));
                await writable.close();
            } else {
                // Fallback
                XLSX.writeFile(wb, 'query-results.xlsx');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to save Excel:', err);
            }
        }
    };

    const exportToPDF = async () => {
        if (!results || !results.rows) return;

        try {
            const doc = new jsPDF({
                orientation: results.columns.length > 5 ? 'landscape' : 'portrait'
            });

            // Add title
            doc.setFontSize(16);
            doc.text('Query Results', 14, 15);

            // Add timestamp
            doc.setFontSize(9);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

            // Prepare table data
            const tableData = sortedRows.map(row =>
                results.columns.map(col => row[col] ?? 'null')
            );

            // Add table using autoTable
            autoTable(doc, {
                startY: 28,
                head: [results.columns],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [31, 41, 55],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
            });

            // Save file
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'query-results.pdf',
                    types: [{
                        description: 'PDF Files',
                        accept: { 'application/pdf': ['.pdf'] },
                    }],
                });
                const pdfBlob = doc.output('blob');
                const writable = await handle.createWritable();
                await writable.write(pdfBlob);
                await writable.close();
            } else {
                // Fallback
                doc.save('query-results.pdf');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to save PDF:', err);
                alert('PDF export failed: ' + err.message);
            }
        }
    };

    // Expose export functions to parent
    useImperativeHandle(ref, () => ({
        exportToCSV,
        exportToExcel,
        exportToPDF
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-ui-text-muted">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ui-spinner"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex items-center justify-center h-full text-ui-text-muted text-sm">
                No results to display
            </div>
        );
    }

    if (results.rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-ui-text-secondary text-sm">
                Query returned 0 rows.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-grid-border">
                    <thead className="bg-grid-header-bg sticky top-0 z-10">
                        <tr>
                            {results.columns.map((col) => (
                                <th
                                    key={col}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap border-b border-grid-border cursor-pointer hover:bg-grid-header-hover transition-colors select-none group border-r border-grid-border last:border-r-0"
                                    onClick={() => requestSort(col)}
                                >
                                    <div className="flex items-center gap-1 text-grid-header-text group-hover:text-grid-header-text-hover transition-colors">
                                        {col}
                                        <span className="text-ui-text-muted group-hover:text-grid-header-text">
                                            {sortConfig.key === col ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                            ) : (
                                                <div className="w-3.5 h-3.5" /> // Placeholder to prevent jump
                                            )}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-grid-bg divide-y divide-grid-row-border">
                        {paginatedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-grid-row-hover transition-colors">
                                {results.columns.map((col) => (
                                    <td
                                        key={`${idx}-${col}`}
                                        className="px-4 py-2 whitespace-nowrap text-sm text-grid-text font-mono border-r border-grid-row-border last:border-r-0"
                                    >
                                        {row[col] !== null && row[col] !== undefined
                                            ? String(row[col])
                                            : <span className="text-grid-text-null italic">null</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-grid-pagination-bg border-t border-grid-border px-4 py-2 flex items-center justify-between flex-shrink-0">
                    <div className="text-xs text-grid-pagination-text">
                        Showing <span className="font-medium text-grid-text">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-grid-text">{Math.min(currentPage * rowsPerPage, sortedRows.length)}</span> of <span className="font-medium text-grid-text">{sortedRows.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-grid-pagination-button-hover disabled:opacity-50 disabled:hover:bg-transparent text-grid-pagination-text transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-grid-pagination-text font-mono">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-grid-pagination-button-hover disabled:opacity-50 disabled:hover:bg-transparent text-grid-pagination-text transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ResultsTable;
