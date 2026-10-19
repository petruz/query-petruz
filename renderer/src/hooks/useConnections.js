import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { queryPetruzApi } from '../services/queryPetruzApi';

/**
 * Custom hook to manage database connections
 * Handles connection CRUD, persistence, selection, and reconnection
 */
export function useConnections() {
    const [connections, setConnections] = useState([]);
    const [activeConnectionId, setActiveConnectionId] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
    const [connectionError, setConnectionError] = useState(null);

    const connectToDatabase = useCallback(async (connection) => {
        if (!connection) return false;
        setConnectionStatus('connecting');
        setConnectionError(null);
        try {
            await queryPetruzApi.connect(connection);
            setConnectionStatus('connected');
            setConnectionError(null);
            return true;
        } catch (err) {
            console.error('Connection failed:', err);
            const errorMessage = err.response?.data?.error || err.message;
            setConnectionStatus('error');
            setConnectionError(errorMessage);
            alert(`Failed to connect to ${connection.name}: ${errorMessage}`);
            return false;
        }
    }, []);

    // Load connections from localStorage on mount and connect to saved active connection
    useEffect(() => {
        const savedConnections = localStorage.getItem('qm_connections');
        const savedActiveId = localStorage.getItem('qm_active_connection_id');

        if (savedConnections) {
            try {
                const loadedConnections = JSON.parse(savedConnections);
                setConnections(loadedConnections);
                if (savedActiveId) {
                    setActiveConnectionId(savedActiveId);
                    const conn = loadedConnections.find(c => c.id === savedActiveId);
                    if (conn) {
                        connectToDatabase(conn);
                    }
                }
            } catch (e) {
                console.error('Failed to parse saved connections from localStorage', e);
            }
        }
    }, [connectToDatabase]);

    // Select and connect/reconnect to a connection (even if already selected)
    const selectConnection = useCallback(async (id, connectionsList = connections) => {
        setActiveConnectionId(id);
        if (id) {
            localStorage.setItem('qm_active_connection_id', id);
            const conn = connectionsList.find(c => c.id === id);
            if (conn) {
                return await connectToDatabase(conn);
            }
        } else {
            localStorage.removeItem('qm_active_connection_id');
            setConnectionStatus('disconnected');
        }
        return false;
    }, [connections, connectToDatabase]);

    // Reconnect to the active connection
    const reconnect = useCallback(async () => {
        if (activeConnectionId) {
            const conn = connections.find(c => c.id === activeConnectionId);
            if (conn) {
                return await connectToDatabase(conn);
            }
        }
        return false;
    }, [activeConnectionId, connections, connectToDatabase]);

    const markDisconnected = useCallback((errorMsg = null) => {
        setConnectionStatus('error');
        if (errorMsg) setConnectionError(errorMsg);
    }, []);

    const handleSaveConnection = async (formData) => {
        const newConn = { ...formData, id: uuidv4() };
        const newConnections = [...connections, newConn];
        setConnections(newConnections);
        localStorage.setItem('qm_connections', JSON.stringify(newConnections));
        await selectConnection(newConn.id, newConnections);
        return newConn.id;
    };

    const handleEditConnection = async (id, formData) => {
        const updatedConnections = connections.map(conn =>
            conn.id === id ? { ...formData, id } : conn
        );
        setConnections(updatedConnections);
        localStorage.setItem('qm_connections', JSON.stringify(updatedConnections));

        // If editing the active connection, reconnect
        if (id === activeConnectionId) {
            const updatedConn = updatedConnections.find(c => c.id === id);
            if (updatedConn) {
                await connectToDatabase(updatedConn);
            }
        }
    };

    const handleTestConnection = async (formData) => {
        return queryPetruzApi.testConnection(formData);
    };

    const handleDeleteConnection = async (id) => {
        if (window.confirm('Are you sure you want to delete this connection?')) {
            const updatedConnections = connections.filter(c => c.id !== id);
            setConnections(updatedConnections);
            localStorage.setItem('qm_connections', JSON.stringify(updatedConnections));

            if (activeConnectionId === id) {
                setActiveConnectionId(null);
                localStorage.removeItem('qm_active_connection_id');
                setConnectionStatus('disconnected');
            }
        }
    };

    const handleSaveConnectionsToFile = async () => {
        const jsonString = JSON.stringify(connections, null, 2);
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'connections.json',
                    types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
            } else {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
                const a = document.createElement('a');
                a.href = dataStr;
                a.download = "connections.json";
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            if (err.name !== 'AbortError') alert('Failed to save connections');
        }
    };

    const handleLoadConnectionsFromFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    const loadedConnections = json;
                    setConnections(loadedConnections);
                    localStorage.setItem('qm_connections', JSON.stringify(loadedConnections));
                    if (loadedConnections.length > 0) {
                        await selectConnection(loadedConnections[0].id, loadedConnections);
                    }
                } catch (err) {
                    alert("Failed to load connections: Invalid JSON");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return {
        connections,
        activeConnectionId,
        setActiveConnectionId,
        selectConnection,
        reconnect,
        connectionStatus,
        connectionError,
        markDisconnected,
        handleSaveConnection,
        handleEditConnection,
        handleTestConnection,
        handleDeleteConnection,
        handleSaveConnectionsToFile,
        handleLoadConnectionsFromFile,
    };
}
