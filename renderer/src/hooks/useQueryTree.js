import { useState, useEffect } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook to manage query tree state and operations
 * Handles tree CRUD, drag-and-drop, file import/export, and persistence
 */
export function useQueryTree() {
    const [treeData, setTreeData] = useState([]);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [activeDragNode, setActiveDragNode] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Load tree from localStorage on mount
    useEffect(() => {
        const savedTree = localStorage.getItem('qm_last_tree');
        if (savedTree) {
            setTreeData(JSON.parse(savedTree));
        } else {
            // Default initial state: Empty "Queries" folder
            setTreeData([
                {
                    id: uuidv4(),
                    name: 'Queries',
                    type: 'FOLDER',
                    children: []
                }
            ]);
        }
    }, []);

    // Auto-save tree to localStorage on change
    useEffect(() => {
        if (treeData.length > 0) {
            localStorage.setItem('qm_last_tree', JSON.stringify(treeData));
        }
    }, [treeData]);

    const handleSelectQuery = (node) => {
        if (node.type === 'QUERY') {
            setSelectedQuery(node);
        }
    };

    const handleRename = (node, newName) => {
        const updateTree = (nodes) => {
            return nodes.map(n => {
                if (n.id === node.id) {
                    return { ...n, name: newName };
                }
                if (n.children) {
                    return { ...n, children: updateTree(n.children) };
                }
                return n;
            });
        };
        setTreeData(updateTree(treeData));
    };

    const handleDelete = (node) => {
        const nodeId = node.id;
        const deleteFromTree = (nodes) => {
            return nodes.filter(n => n.id !== nodeId).map(n => {
                if (n.children) {
                    return { ...n, children: deleteFromTree(n.children) };
                }
                return n;
            });
        };
        setTreeData(deleteFromTree(treeData));
        if (selectedQuery?.id === nodeId) {
            setSelectedQuery(null);
        }
    };

    const handleAddFolder = (name, parentNode = null) => {
        const newFolder = { id: uuidv4(), name, type: 'FOLDER', children: [] };

        if (parentNode) {
            // Add to parent folder
            const addToParent = (nodes) => {
                return nodes.map(node => {
                    if (node.id === parentNode.id) {
                        return { ...node, children: [...(node.children || []), newFolder] };
                    }
                    if (node.children) {
                        return { ...node, children: addToParent(node.children) };
                    }
                    return node;
                });
            };
            setTreeData(addToParent(treeData));
        } else {
            // Add to root
            setTreeData([...treeData, newFolder]);
        }
    };

    const handleAddQuery = (name, parentNode = null) => {
        const newQuery = { id: uuidv4(), name, type: 'QUERY', query: 'SELECT * FROM ...', children: [] };

        if (parentNode) {
            // Add to parent folder
            const addToParent = (nodes) => {
                return nodes.map(node => {
                    if (node.id === parentNode.id) {
                        return { ...node, children: [...(node.children || []), newQuery] };
                    }
                    if (node.children) {
                        return { ...node, children: addToParent(node.children) };
                    }
                    return node;
                });
            };
            setTreeData(addToParent(treeData));
        } else {
            // Add to root
            setTreeData([...treeData, newQuery]);
        }
    };

    const handleSaveQuery = (query, sql) => {
        const updateTree = (nodes) => {
            return nodes.map(node => {
                if (node.id === query.id) {
                    return { ...node, query: sql };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        const newTreeData = updateTree(treeData);
        setTreeData(newTreeData);

        // Update selectedQuery to reflect the saved state
        setSelectedQuery({ ...query, query: sql });
    };

    const handleSaveChartConfig = (query, chartConfig) => {
        const updateTree = (nodes) => {
            return nodes.map(node => {
                if (node.id === query.id) {
                    return { ...node, chartConfig };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        const newTreeData = updateTree(treeData);
        setTreeData(newTreeData);

        // Update selectedQuery to reflect the saved chart config
        setSelectedQuery({ ...query, chartConfig });
    };

    const handleSaveComment = (query, comment) => {
        const updateTree = (nodes) => nodes.map(node => {
            if (node.id === query.id) return { ...node, comment };
            return node.children ? { ...node, children: updateTree(node.children) } : node;
        });
        const newTreeData = updateTree(treeData);
        setTreeData(newTreeData);
        setSelectedQuery({ ...query, comment });
    };

    const handleSaveLibrary = async () => {
        const jsonString = JSON.stringify(treeData, null, 2);

        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'query_library.json',
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
            } else {
                // Fallback for browsers that don't support the API
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "query_library.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to save library:', err);
                alert('Failed to save library');
            }
        }
    };

    const handleOpenLibrary = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    setTreeData(json);
                } catch (err) {
                    console.error("Invalid JSON", err);
                    alert("Failed to load library: Invalid JSON");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Drag and drop handlers
    const handleDragStart = (event) => {
        setActiveDragNode(event.active.data.current.node);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragNode(null);

        if (!over) {
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) {
            return;
        }

        setTreeData((items) => {
            // Helper to find parent of a node
            const findParent = (nodes, id) => {
                for (const node of nodes) {
                    if (node.children && node.children.some(child => child.id === id)) {
                        return node;
                    }
                    if (node.children) {
                        const found = findParent(node.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const activeParent = findParent(items, activeId);
            const overParent = findParent(items, overId);
            const activeNode = findNodeById(items, activeId);
            const overNode = findNodeById(items, overId);

            // A folder is a drop target even when both nodes currently share the root.
            if (overNode?.type === 'FOLDER') {
                if (activeParent?.id === overId) return items;
                if (activeNode?.type === 'FOLDER' && containsNode(activeNode, overId)) return items;
                return moveNode(items, activeId, overId);
            }

            // Reorder only when the target is another item in the same container.
            const sameParent = (activeParent === null && overParent === null) ||
                (activeParent?.id === overParent?.id);

            if (sameParent) {
                return reorderNodes(items, activeId, overId);
            }

            return items;
        });
    };

    // Helper to find a node by ID
    const findNodeById = (nodes, id) => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const containsNode = (node, id) =>
        node.id === id || (node.children || []).some(child => containsNode(child, id));

    // Helper to reorder nodes recursively
    const reorderNodes = (nodes, activeId, overId) => {
        const activeNodeIndex = nodes.findIndex(n => n.id === activeId);
        const overNodeIndex = nodes.findIndex(n => n.id === overId);

        if (activeNodeIndex !== -1 && overNodeIndex !== -1) {
            // Found both at this level, reorder them
            return arrayMove(nodes, activeNodeIndex, overNodeIndex);
        }

        // Recursively search in children
        return nodes.map(node => {
            if (node.children && node.children.length > 0) {
                return {
                    ...node,
                    children: reorderNodes(node.children, activeId, overId)
                };
            }
            return node;
        });
    };

    // Helper from dnd-kit
    const arrayMove = (array, from, to) => {
        const newArray = array.slice();
        const [removed] = newArray.splice(from, 1);
        newArray.splice(to, 0, removed);
        return newArray;
    };

    const moveNode = (nodes, nodeId, targetFolderId) => {
        let nodeToMove = null;

        // 1. Remove node from old location
        const removeNode = (list) =>
            list.reduce((remaining, item) => {
                if (item.id === nodeId) {
                    nodeToMove = item;
                    return remaining;
                }
                remaining.push(item.children ? { ...item, children: removeNode(item.children) } : item);
                return remaining;
            }, []);

        const newTree = removeNode(nodes);

        if (!nodeToMove) return nodes; // Failed to find node

        // 2. Add node to new location
        const addNode = (list) => {
            return list.map(item => {
                if (item.id === targetFolderId && item.type === 'FOLDER') {
                    return { ...item, children: [...(item.children || []), nodeToMove] };
                }
                if (item.children) {
                    return { ...item, children: addNode(item.children) };
                }
                return item;
            });
        };

        return addNode(newTree);
    };

    return {
        treeData,
        selectedQuery,
        activeDragNode,
        sensors,
        handleSelectQuery,
        handleRename,
        handleDelete,
        handleAddFolder,
        handleAddQuery,
        handleSaveQuery,
        handleSaveComment,
        handleSaveChartConfig,
        handleSaveLibrary,
        handleOpenLibrary,
        handleDragStart,
        handleDragEnd,
    };
}
