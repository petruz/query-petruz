import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { queryPetruzApi } from '../services/queryPetruzApi';

/**
 * Custom hook to manage database connections
 * Handles connection CRUD, persistence, and file import/export
 */
export function useConnections() {
    const [connections, setConnections] = useState([]);
    const [activeConnectionId, setActiveConnectionId] = useState(null);

    // Load connections from localStorage on mount
    useEffect(() => {
        const savedConnections = localStorage.getItem('qm_connections');
        const savedActiveId = localStorage.getItem('qm_active_connection_id');

        if (savedConnections) {
            const loadedConnections = JSON.parse(savedConnections);
            setConnections(loadedConnections);
        }
        if (savedActiveId) {
            setActiveConnectionId(savedActiveId);
        }
    }, []);

    // Auto-connect when activeConnectionId changes
    useEffect(() => {
        if (activeConnectionId && connections.length > 0) {
            const conn = connections.find(c => c.id === activeConnectionId);
            if (conn) {
                connectToDatabase(conn);
                localStorage.setItem('qm_active_connection_id', activeConnectionId);
            }
        }
    }, [activeConnectionId, connections]);

    const connectToDatabase = async (connection) => {
        try {
            await queryPetruzApi.connect(connection);
        } catch (err) {
            console.error('Connection failed:', err);
            alert(`Failed to connect to ${connection.name}: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleSaveConnection = async (formData) => {
        const newConn = { ...formData, id: uuidv4() };
        const newConnections = [...connections, newConn];
        setConnections(newConnections);
        localStorage.setItem('qm_connections', JSON.stringify(newConnections));
        setActiveConnectionId(newConn.id); // Auto-select new connection
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
                connectToDatabase(updatedConn);
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
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    const loadedConnections = json;
                    setConnections(loadedConnections);
                    localStorage.setItem('qm_connections', JSON.stringify(loadedConnections));
                    if (loadedConnections.length > 0) setActiveConnectionId(loadedConnections[0].id);
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
        handleSaveConnection,
        handleEditConnection,
        handleTestConnection,
        handleDeleteConnection,
        handleSaveConnectionsToFile,
        handleLoadConnectionsFromFile,
    };
}
