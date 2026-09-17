import React, { useState, useEffect } from 'react';

const CartesianConfig = ({ config, setConfig, columns, yColumnsInput, setYColumnsInput, errors }) => {
    return (
        <div className="space-y-4">
            {/* X-Axis Column */}
            <div>
                <label className="block text-sm font-medium text-modal-text-muted mb-1">
                    X-Axis Column (0-indexed)
                </label>
                <input
                    type="number"
                    min="0"
                    value={config.xColumn}
                    onChange={(e) => setConfig({ ...config, xColumn: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                />
                {errors.xColumn && (
                    <p className="text-xs text-red-400 mt-1">{errors.xColumn}</p>
                )}
            </div>

            {/* Y-Axis Columns */}
            <div>
                <label className="block text-sm font-medium text-modal-text-muted mb-1">
                    Y-Axis Columns (comma-separated, 0-indexed)
                </label>
                <input
                    type="text"
                    value={yColumnsInput}
                    onChange={(e) => setYColumnsInput(e.target.value)}
                    placeholder="e.g., 1, 2, 3"
                    className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-modal-text-muted mt-1">
                    Enter column indices separated by commas (e.g., "1, 2, 3")
                </p>
                {errors.yColumns && (
                    <p className="text-xs text-red-400 mt-1">{errors.yColumns}</p>
                )}
            </div>
        </div>
    );
};

const CircularConfig = ({ config, setConfig, columns, yColumnsInput, setYColumnsInput, errors }) => {
    return (
        <div className="space-y-4">
            {/* Label Column */}
            <div>
                <label className="block text-sm font-medium text-modal-text-muted mb-1">
                    Label Column (0-indexed)
                </label>
                <input
                    type="number"
                    min="0"
                    value={config.xColumn}
                    onChange={(e) => setConfig({ ...config, xColumn: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                />
                {errors.xColumn && (
                    <p className="text-xs text-red-400 mt-1">{errors.xColumn}</p>
                )}
            </div>

            {/* Value Column */}
            <div>
                <label className="block text-sm font-medium text-modal-text-muted mb-1">
                    Value Column (0-indexed)
                </label>
                <input
                    type="text"
                    value={yColumnsInput}
                    onChange={(e) => setYColumnsInput(e.target.value)}
                    placeholder="e.g., 1"
                    className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-modal-text-muted mt-1">
                    Enter the column index for values (e.g., "1")
                </p>
                {errors.yColumns && (
                    <p className="text-xs text-red-400 mt-1">{errors.yColumns}</p>
                )}
            </div>
        </div>
    );
};

const ChartConfigModal = ({ initialConfig, columns = [], onSave, onCancel }) => {
    const [config, setConfig] = useState({
        type: 'line',
        xColumn: 0,
        yColumns: [],
        defaultToChart: false
    });
    const [yColumnsInput, setYColumnsInput] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialConfig) {
            setConfig({
                ...initialConfig,
                defaultToChart: initialConfig.defaultToChart || false
            });
            setYColumnsInput(initialConfig.yColumns.join(', '));
        }
    }, [initialConfig]);

    const isCircular = ['pie', 'polarArea'].includes(config.type);

    const validateConfig = () => {
        const newErrors = {};

        // Validate X/Label column
        if (config.xColumn < 0) {
            newErrors.xColumn = `${isCircular ? 'Label' : 'X'} column must be non-negative`;
        } else if (columns.length > 0 && config.xColumn >= columns.length) {
            newErrors.xColumn = `${isCircular ? 'Label' : 'X'} column must be between 0 and ${columns.length - 1}`;
        }

        // Validate Y/Value columns
        const yColumns = yColumnsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10));

        if (yColumns.length === 0) {
            newErrors.yColumns = `At least one ${isCircular ? 'Value' : 'Y'} column is required`;
        } else if (isCircular && yColumns.length > 1) {
            newErrors.yColumns = `${config.type === 'pie' ? 'Pie' : 'Polar'} chart supports only one value column`;
        } else {
            for (const col of yColumns) {
                if (isNaN(col)) {
                    newErrors.yColumns = 'Columns must be valid numbers';
                    break;
                }
                if (col < 0) {
                    newErrors.yColumns = 'Columns must be non-negative';
                    break;
                }
                if (columns.length > 0 && col >= columns.length) {
                    newErrors.yColumns = `Columns must be between 0 and ${columns.length - 1}`;
                    break;
                }
                if (col === config.xColumn) {
                    newErrors.yColumns = `${isCircular ? 'Value' : 'Y'} column cannot be the same as ${isCircular ? 'Label' : 'X'} column`;
                    break;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateConfig()) return;

        const yColumns = yColumnsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10));

        onSave({
            ...config,
            yColumns
        });
    };

    const getColumnPreview = () => {
        const yColumns = yColumnsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10))
            .filter(n => !isNaN(n) && n >= 0 && (columns.length === 0 || n < columns.length));

        const xLabel = columns.length > 0 ? columns[config.xColumn] : `Column ${config.xColumn}`;
        const yLabels = yColumns.map(col => columns.length > 0 ? columns[col] : `Column ${col}`);

        return {
            x: xLabel || 'Invalid',
            y: yLabels
        };
    };

    const preview = getColumnPreview();

    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-[500px] p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-modal-text mb-4">Configure Chart</h2>

                <div className="space-y-4">
                    {/* Chart Title */}
                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-1">
                            Chart Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={config.title || ''}
                            onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            placeholder="Enter chart title..."
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Chart Type */}
                    <div>
                        <label className="block text-sm font-medium text-modal-text-muted mb-2">Chart Type</label>
                        <select
                            value={config.type}
                            onChange={(e) => setConfig({ ...config, type: e.target.value })}
                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                        >
                            <option value="line">Line Chart</option>
                            <option value="area">Area Chart</option>
                            <option value="bar">Bar Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="polarArea">Polar Area Chart</option>
                        </select>
                    </div>

                    {/* Default View Preference */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="defaultToChart"
                            checked={config.defaultToChart}
                            onChange={(e) => setConfig({ ...config, defaultToChart: e.target.checked })}
                            className="rounded bg-modal-input-bg border-modal-input-border text-modal-button-primary-bg focus:ring-modal-button-primary-bg"
                        />
                        <label htmlFor="defaultToChart" className="text-sm font-medium text-modal-text cursor-pointer select-none">
                            Execute as Chart by default
                        </label>
                    </div>

                    {/* Chart Configuration Form */}
                    {isCircular ? (
                        <CircularConfig
                            config={config}
                            setConfig={setConfig}
                            columns={columns}
                            yColumnsInput={yColumnsInput}
                            setYColumnsInput={setYColumnsInput}
                            errors={errors}
                        />
                    ) : (
                        <CartesianConfig
                            config={config}
                            setConfig={setConfig}
                            columns={columns}
                            yColumnsInput={yColumnsInput}
                            setYColumnsInput={setYColumnsInput}
                            errors={errors}
                        />
                    )}

                    {/* Preview */}
                    <div className="bg-modal-input-bg border border-modal-input-border rounded p-3">
                        <h3 className="text-sm font-medium text-modal-text mb-2">Preview</h3>
                        <div className="space-y-1 text-sm text-modal-text-secondary">
                            <div>
                                <span className="font-medium">{isCircular ? 'Label:' : 'X-Axis:'}</span> {preview.x} (Column {config.xColumn})
                            </div>
                            {preview.y.length > 0 && (
                                <div>
                                    <span className="font-medium">{isCircular ? 'Value:' : 'Y-Axis Series:'}</span>
                                    <ul className="ml-4 mt-1 space-y-0.5">
                                        {preview.y.map((col, idx) => (
                                            <li key={idx}>• {col}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {preview.y.length === 0 && (
                                <div className="text-modal-text-muted italic">No valid columns specified</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-transparent border border-modal-input-border text-modal-text-secondary hover:bg-modal-button-secondary-bg transition-colors text-sm font-medium rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-modal-button-primary-bg hover:bg-modal-button-primary-hover text-modal-button-text border border-modal-button-primary-bg rounded text-sm font-medium transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartConfigModal;
