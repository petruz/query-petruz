import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import QueryEditor from './components/QueryEditor';
import ResultsTable from './components/ResultsTable';
import StatusFooter from './components/StatusFooter';
import MenuBar from './components/MenuBar';
import ContextMenu from './components/ContextMenu';
import InputModal from './components/InputModal';
import CommentModal from './components/CommentModal';
import ConnectionModal from './components/ConnectionModal';
import AboutModal from './components/AboutModal';
import ChartConfigModal from './components/ChartConfigModal';
import ChartView from './components/ChartView';
import { Play, ChevronDown, ChevronRight, Save, Search, BarChart3, Table } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useTheme } from './context/ThemeContext';
import { useLayout } from './hooks/useLayout';
import { useModals } from './hooks/useModals';
import { useConnections } from './hooks/useConnections';
import { useQueryExecution } from './hooks/useQueryExecution';
import { useQueryTree } from './hooks/useQueryTree';
import { queryPetruzApi } from './services/queryPetruzApi';
import ReactMarkdown from 'react-markdown';

function App() {
    // Theme
    const { theme, availableThemes, switchTheme } = useTheme();

    // Custom hooks
    const layout = useLayout();
    const modals = useModals();
    const connections = useConnections();
    const queryTree = useQueryTree();
    const queryExecution = useQueryExecution(queryTree.selectedQuery);

    // Connection editing state
    const [editingConnection, setEditingConnection] = React.useState(null);
    // Chart config state
    const [chartConfigModal, setChartConfigModal] = React.useState(false);
    const [commentModalQuery, setCommentModalQuery] = React.useState(null);
    const [isCommentPreviewVisible, setIsCommentPreviewVisible] = React.useState(false);
    const headerComment = queryTree.selectedQuery?.comment || queryExecution.queryComments;

    // Update SQL when selected query changes
    useEffect(() => {
        if (queryTree.selectedQuery) {
            queryExecution.updateSqlFromQuery(queryTree.selectedQuery);
        }
    }, [queryTree.selectedQuery]);

    // Handle query save
    const handleSaveQuery = () => {
        if (!queryTree.selectedQuery) return;
        queryTree.handleSaveQuery(queryTree.selectedQuery, queryExecution.sql);
    };

    // Handle modal actions
    const handleModalConfirm = (value) => {
        if (modals.modal.type === 'RENAME') {
            queryTree.handleRename(modals.modal.node, value);
        } else if (modals.modal.type === 'ADD_FOLDER') {
            queryTree.handleAddFolder(value, modals.modal.parentNode);
        } else if (modals.modal.type === 'ADD_QUERY') {
            queryTree.handleAddQuery(value, modals.modal.parentNode);
        }
        modals.setModal(null);
    };

    // Handle connection edit
    const handleEditConnection = (connection) => {
        setEditingConnection(connection);
        modals.setConnectionModal(true);
    };

    // Handle chart config
    const handleConfigureChart = () => {
        setChartConfigModal(true);
        modals.setContextMenu(null);
    };

    const handleSaveChartConfig = (config) => {
        queryTree.handleSaveChartConfig(queryTree.selectedQuery, config);
        setChartConfigModal(false);
        // Auto-switch to chart view
        queryExecution.setViewMode('chart');
    };

    const handleImportDriver = async () => {
        try {
            const result = await queryPetruzApi.importJdbcDriver();
            if (!result.canceled) alert(`Imported ${result.fileName}. Open a new connection to refresh the driver list.`);
        } catch (error) {
            alert(`Failed to import JDBC driver: ${error.message}`);
        }
    };

    return (
        <DndContext sensors={queryTree.sensors} onDragStart={queryTree.handleDragStart} onDragEnd={queryTree.handleDragEnd}>
            <div className="flex flex-col h-screen bg-ui-bg-primary text-ui-text-primary overflow-hidden font-sans" onClick={() => modals.setContextMenu(null)}>
                {/* Menu Bar */}
                <MenuBar
                    onOpenLibrary={queryTree.handleOpenLibrary}
                    onSaveLibrary={queryTree.handleSaveLibrary}
                    onNewConnection={() => {
                        setEditingConnection(null);
                        modals.setConnectionModal(true);
                    }}
                    onImportDriver={handleImportDriver}
                    onLoadConnections={connections.handleLoadConnectionsFromFile}
                    onSaveConnections={connections.handleSaveConnectionsToFile}
                    onAbout={() => modals.setAboutModal(true)}
                    currentTheme={theme}
                    availableThemes={availableThemes}
                    onThemeChange={switchTheme}
                />

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div
                        className="flex flex-col border-r border-ui-border relative flex-shrink-0"
                        style={{ width: layout.sidebarWidth }}
                    >
                        <div className="p-4 border-b border-tree-border flex justify-between items-center bg-tree-header-bg">
                            <span className="font-bold text-xl tracking-tight text-tree-header-text">Query Mole</span>
                            <div className="flex gap-1">
                                <button onClick={() => modals.setModal({ type: 'ADD_FOLDER' })} className="text-tree-text-muted hover:text-tree-text" title="Add Folder">+</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <Sidebar
                                nodes={queryTree.treeData}
                                onSelect={queryTree.handleSelectQuery}
                                selectedId={queryTree.selectedQuery?.id}
                                onContextMenu={modals.handleNodeContextMenu}
                                connections={connections.connections}
                                activeConnectionId={connections.activeConnectionId}
                                onConnectionChange={connections.setActiveConnectionId}
                                onDeleteConnection={connections.handleDeleteConnection}
                                onEditConnection={handleEditConnection}
                            />
                        </div>

                        {/* Sidebar Resizer Handle */}
                        <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-ui-resize-handle transition-colors z-10"
                            onMouseDown={layout.startResizingSidebar}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 h-full">
                        {/* Top: Editor */}
                        <div
                            className="flex flex-col bg-editor-header-bg border-b border-editor-border relative flex-shrink-0"
                            style={{ height: layout.isEditorVisible ? layout.editorHeight : 'auto' }}
                        >
                            <div className="p-2 border-b border-editor-border flex justify-between items-center bg-editor-header-bg select-none">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => layout.setIsEditorVisible(!layout.isEditorVisible)}
                                        className="text-editor-header-text hover:text-editor-text transition-colors focus:outline-none"
                                        title={layout.isEditorVisible ? "Collapse Editor" : "Expand Editor"}
                                    >
                                        {layout.isEditorVisible ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                    <span
                                        className="text-sm text-editor-header-text font-bold truncate relative"
                                        title={headerComment || undefined}
                                        onMouseEnter={() => setIsCommentPreviewVisible(Boolean(headerComment))}
                                        onMouseLeave={() => setIsCommentPreviewVisible(false)}
                                    >
                                        {queryTree.selectedQuery ? queryTree.selectedQuery.name : 'Select a query'}
                                        {isCommentPreviewVisible && (
                                            <span className="absolute left-0 top-full mt-2 w-96 max-w-[70vw] bg-gray-900 text-white text-xs rounded py-2 px-3 z-50 shadow-lg whitespace-normal pointer-events-none">
                                                <ReactMarkdown>{headerComment}</ReactMarkdown>
                                            </span>
                                        )}
                                    </span>
                                    {queryTree.selectedQuery && queryExecution.sql !== (queryTree.selectedQuery.query || '') && (
                                        <button
                                            onClick={handleSaveQuery}
                                            className="text-editor-header-text hover:text-tree-item-selected-text transition-colors"
                                            title="Save Query Change"
                                        >
                                            <Save size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Filter Input */}
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-editor-header-text" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Filter results..."
                                            value={queryExecution.filterText}
                                            onChange={(e) => queryExecution.setFilterText(e.target.value)}
                                            className="pl-8 pr-3 py-1.5 text-sm bg-editor-bg border border-editor-border rounded text-editor-text placeholder-editor-header-text focus:outline-none focus:border-tree-item-selected-text transition-colors w-48"
                                        />
                                    </div>
                                    {/* View Toggle */}
                                    {queryTree.selectedQuery?.chartConfig && (
                                        <button
                                            onClick={() => queryExecution.setViewMode(queryExecution.viewMode === 'grid' ? 'chart' : 'grid')}
                                            className="text-editor-header-text hover:text-editor-text transition-colors p-1 mr-2"
                                            title={queryExecution.viewMode === 'grid' ? "Switch to Chart View" : "Switch to Grid View"}
                                        >
                                            {queryExecution.viewMode === 'grid' ? <BarChart3 size={16} /> : <Table size={16} />}
                                        </button>
                                    )}
                                    {/* Execute Button */}
                                    <button
                                        onClick={queryExecution.handleExecute}
                                        disabled={queryExecution.loading || !queryExecution.sql}
                                        className="flex items-center gap-2 bg-editor-button-bg hover:bg-editor-button-hover disabled:bg-editor-button-disabled text-editor-button-text px-4 py-1.5 rounded text-sm font-medium transition-colors"
                                    >
                                        <Play size={16} />
                                        Execute
                                    </button>
                                </div>
                            </div>

                            {layout.isEditorVisible && (
                                <>
                                    <div className="flex-1 relative overflow-hidden">
                                        <QueryEditor value={queryExecution.sql} onChange={queryExecution.setSql} />
                                    </div>
                                    {/* Editor Resizer Handle */}
                                    <div
                                        className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-ui-resize-handle transition-colors z-10"
                                        onMouseDown={layout.startResizingEditor}
                                    />
                                </>
                            )}
                        </div>

                        {/* Middle: Results */}
                        <div className="flex-1 overflow-hidden bg-grid-bg flex flex-col min-h-0">
                            {queryExecution.error && (
                                <div className="p-4 bg-ui-error-bg text-ui-error-text border-b border-ui-error-border flex-shrink-0">
                                    Error: {queryExecution.error}
                                </div>
                            )}
                            <div className="flex-1 overflow-auto">
                                {queryExecution.viewMode === 'chart' ? (
                                    <div className="h-full w-full bg-grid-bg">
                                        <div ref={queryExecution.chartViewRef} className="h-full w-full">
                                            <ChartView
                                                results={queryExecution.results}
                                                chartConfig={queryTree.selectedQuery?.chartConfig}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <ResultsTable
                                        ref={queryExecution.resultsTableRef}
                                        results={queryExecution.results}
                                        loading={queryExecution.loading}
                                        filterText={queryExecution.filterText}
                                    />
                                )}
                            </div>

                            {/* Bottom: Footer */}
                            <div
                                className="relative bg-ui-bg-secondary border-t border-ui-border flex-shrink-0"
                                style={{ height: layout.footerHeight }}
                            >
                                {/* Footer Resizer Handle */}
                                <div
                                    className="absolute top-0 left-0 w-full h-1 cursor-row-resize hover:bg-ui-resize-handle transition-colors z-10"
                                    onMouseDown={layout.startResizingFooter}
                                />
                                <StatusFooter
                                    executionTime={queryExecution.results?.executionTimeMs}
                                    rowCount={queryExecution.results?.rows?.length}
                                    onExportCSV={queryExecution.handleExportCSV}
                                    onExportExcel={queryExecution.handleExportExcel}
                                    onExportPDF={queryExecution.handleExportPDF}
                                    onExportChartImage={queryExecution.handleExportChartImage}
                                    onExportChartPDF={queryExecution.handleExportChartPDF}
                                    hasResults={!!queryExecution.results && queryExecution.results.rows && queryExecution.results.rows.length > 0}
                                    viewMode={queryExecution.viewMode}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals & Menus */}
                {modals.contextMenu && (
                    <ContextMenu
                        x={modals.contextMenu.x}
                        y={modals.contextMenu.y}
                        onClose={() => modals.setContextMenu(null)}
                        onRename={() => {
                            modals.setModal({ type: 'RENAME', node: modals.contextMenu.node });
                            modals.setContextMenu(null);
                        }}
                        onDelete={() => {
                            queryTree.handleDelete(modals.contextMenu.node);
                            modals.setContextMenu(null);
                        }}
                        onAddQuery={() => {
                            modals.setModal({ type: 'ADD_QUERY', parentNode: modals.contextMenu.node });
                            modals.setContextMenu(null);
                        }}
                        onAddFolder={() => {
                            modals.setModal({ type: 'ADD_FOLDER', parentNode: modals.contextMenu.node });
                            modals.setContextMenu(null);
                        }}
                        onConfigureChart={handleConfigureChart}
                        onEditComment={() => {
                            setCommentModalQuery(modals.contextMenu.node);
                            modals.setContextMenu(null);
                        }}
                        type={modals.contextMenu.node.type}
                    />
                )}

                {modals.modal && (
                    <InputModal
                        title={
                            modals.modal.type === 'RENAME' ? 'Rename Item' :
                                modals.modal.type === 'ADD_FOLDER' ? 'New Folder' : 'New Query'
                        }
                        initialValue={modals.modal.type === 'RENAME' ? modals.modal.node.name : ''}
                        onConfirm={handleModalConfirm}
                        onCancel={() => modals.setModal(null)}
                    />
                )}

                {modals.connectionModal && (
                    <ConnectionModal
                        initialData={editingConnection}
                        onSave={async (formData) => {
                            if (editingConnection) {
                                await connections.handleEditConnection(editingConnection.id, formData);
                            } else {
                                await connections.handleSaveConnection(formData);
                            }
                            modals.setConnectionModal(false);
                            setEditingConnection(null);
                        }}
                        onCancel={() => {
                            modals.setConnectionModal(false);
                            setEditingConnection(null);
                        }}
                        onTest={connections.handleTestConnection}
                    />
                )}

                {commentModalQuery && (
                    <CommentModal
                        initialValue={commentModalQuery.comment}
                        onSave={(comment) => {
                            queryTree.handleSaveComment(commentModalQuery, comment);
                            setCommentModalQuery(null);
                        }}
                        onCancel={() => setCommentModalQuery(null)}
                    />
                )}

                {modals.aboutModal && (
                    <AboutModal onClose={() => modals.setAboutModal(false)} />
                )}

                {chartConfigModal && queryTree.selectedQuery && (
                    <ChartConfigModal
                        initialConfig={queryTree.selectedQuery.chartConfig}
                        columns={queryExecution.results?.columns || []}
                        onSave={handleSaveChartConfig}
                        onCancel={() => setChartConfigModal(false)}
                    />
                )}

                <DragOverlay>
                    {queryTree.activeDragNode ? (
                        <div className="px-2 py-1 bg-tree-item-hover rounded shadow text-tree-text opacity-80">
                            {queryTree.activeDragNode.name}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext >
    );
}

export default App;
