import React, { useRef } from 'react';
import { Line, Bar, Pie, PolarArea } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const CHART_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

const ChartView = ({ results, chartConfig }) => {
    const chartRef = useRef(null);

    if (!results || !results.rows || results.rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-modal-text-muted">
                No data to display
            </div>
        );
    }

    if (!chartConfig) {
        return (
            <div className="flex items-center justify-center h-full text-modal-text-muted">
                No chart configuration found. Right-click on the query to configure a chart.
            </div>
        );
    }

    // Validate column indices
    const maxCol = results.columns.length - 1;
    if (chartConfig.xColumn < 0 || chartConfig.xColumn > maxCol) {
        return (
            <div className="flex items-center justify-center h-full text-red-400">
                Invalid X column index: {chartConfig.xColumn}. Must be between 0 and {maxCol}.
            </div>
        );
    }

    for (const yCol of chartConfig.yColumns) {
        if (yCol < 0 || yCol > maxCol) {
            return (
                <div className="flex items-center justify-center h-full text-red-400">
                    Invalid Y column index: {yCol}. Must be between 0 and {maxCol}.
                </div>
            );
        }
    }

    // Transform data for Chart.js
    const xColumnName = results.columns[chartConfig.xColumn];
    const labels = results.rows.map(row => {
        const value = row[xColumnName];
        return value !== null && value !== undefined ? String(value) : '';
    });

    let datasets = [];
    const isCircular = ['pie', 'polarArea'].includes(chartConfig.type);

    if (isCircular) {
        const yColIndex = chartConfig.yColumns[0];
        const yColName = results.columns[yColIndex];

        datasets = [{
            label: yColName,
            data: results.rows.map(row => {
                const value = row[yColName];
                return value !== null && value !== undefined ? Number(value) : null;
            }),
            backgroundColor: results.rows.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderColor: '#ffffff', // White border for separation
            borderWidth: 1,
        }];
    } else {
        datasets = chartConfig.yColumns.map((colIndex, i) => {
            const colName = results.columns[colIndex];
            const colorIndex = i % CHART_COLORS.length;
            const color = CHART_COLORS[colorIndex];

            return {
                label: colName,
                data: results.rows.map(row => {
                    const value = row[colName];
                    // Convert to number, handle null/undefined
                    return value !== null && value !== undefined ? Number(value) : null;
                }),
                borderColor: color,
                backgroundColor: chartConfig.type === 'bar' ? color : (chartConfig.type === 'area' ? color + '33' : color), // Opacity for area fill
                borderWidth: 2,
                tension: 0.1, // Smooth lines
                fill: chartConfig.type === 'area',
            };
        });
    }

    const data = {
        labels,
        datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: !!chartConfig.title,
                text: chartConfig.title,
                color: 'rgb(209, 213, 219)', // text-gray-300
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    bottom: 20
                }
            },
            legend: {
                position: 'top',
                labels: {
                    color: 'rgb(209, 213, 219)', // text-gray-300
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                mode: isCircular ? 'nearest' : 'index',
                intersect: isCircular,
            }
        },
        scales: chartConfig.type === 'pie' ? {
            // Pie charts don't typically use axes/scales
        } : (chartConfig.type === 'polarArea' || isCircular) ? {
            r: {
                ticks: {
                    backdropColor: 'transparent',
                    color: 'rgb(156, 163, 175)'
                },
                grid: {
                    color: 'rgba(75, 85, 99, 0.3)'
                }
            }
        } : {
            x: {
                ticks: {
                    color: 'rgb(156, 163, 175)', // text-gray-400
                    maxRotation: 45,
                    minRotation: 0
                },
                grid: {
                    color: 'rgba(75, 85, 99, 0.3)' // gray-600 with opacity
                }
            },
            y: {
                ticks: {
                    color: 'rgb(156, 163, 175)' // text-gray-400
                },
                grid: {
                    color: 'rgba(75, 85, 99, 0.3)' // gray-600 with opacity
                }
            }
        },
        interaction: isCircular ? {} : {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div className="w-full h-full p-4">
            <div className="w-full h-full">
                {(chartConfig.type === 'line' || chartConfig.type === 'area') ? (
                    <Line ref={chartRef} data={data} options={options} />
                ) : chartConfig.type === 'bar' ? (
                    <Bar ref={chartRef} data={data} options={options} />
                ) : chartConfig.type === 'pie' ? (
                    <div className="relative w-full h-full flex justify-center">
                        <div className="w-full max-w-2xl">
                            <Pie ref={chartRef} data={data} options={options} />
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex justify-center">
                        <div className="w-full max-w-2xl">
                            <PolarArea ref={chartRef} data={data} options={options} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartView;
