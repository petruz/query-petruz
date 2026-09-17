import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { extractSqlComments } from '../utils/commentExtractor';
import { queryPetruzApi } from '../services/queryPetruzApi';

/**
 * Custom hook to manage SQL query execution and results
 * Handles SQL state, execution, results, filtering, and exports
 */
export function useQueryExecution(selectedQuery) {
    const [sql, setSql] = useState('');
    const [queryComments, setQueryComments] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'chart'

    const resultsTableRef = useRef(null);
    const chartViewRef = useRef(null);

    // Update SQL when selectedQuery changes
    const updateSqlFromQuery = (query) => {
        if (query && query.type === 'QUERY') {
            const queryText = query.query || '';
            setSql(queryText);
            setQueryComments(extractSqlComments(queryText));
            setResults(null);
            setError(null);
            // Auto-switch to chart view if defaultToChart is true
            if (query.chartConfig && query.chartConfig.defaultToChart) {
                setViewMode('chart');
            } else {
                setViewMode('grid');
            }
        }
    };

    const handleExecute = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await queryPetruzApi.execute(sql);
            if (response.success) {
                setResults(response);
            } else {
                setError(response.error);
                setResults(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => resultsTableRef.current?.exportToCSV();
    const handleExportExcel = () => resultsTableRef.current?.exportToExcel();
    const handleExportPDF = () => resultsTableRef.current?.exportToPDF();

    const handleExportChartImage = async (queryName = 'chart') => {
        if (!chartViewRef.current) return;

        // Find the canvas element inside the chart container
        const canvas = chartViewRef.current.querySelector('canvas');
        if (!canvas) return;

        // Create a link to download the image
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${queryName}.png`;
        a.click();
    };

    const handleExportChartPDF = async (queryName = 'chart') => {
        if (!chartViewRef.current) return;

        const canvas = chartViewRef.current.querySelector('canvas');
        if (!canvas) return;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape');

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${queryName}.pdf`);
    };

    return {
        sql,
        setSql,
        queryComments,
        setQueryComments,
        results,
        loading,
        error,
        filterText,
        setFilterText,
        viewMode,
        setViewMode,
        handleExecute,
        resultsTableRef,
        chartViewRef,
        handleExportCSV,
        handleExportExcel,
        handleExportPDF,
        handleExportChartImage,
        handleExportChartPDF,
        updateSqlFromQuery,
    };
}
