import React, { useState, useEffect } from 'react';
import { queryPetruzApi } from '../services/queryPetruzApi';

const DATABASE_TYPES = [
    {
        id: 'postgresql',
        name: 'PostgreSQL',
        icon: '🐘',
        defaultPort: 5432,
        defaultDb: 'postgres',
        urlTemplate: 'jdbc:postgresql://{host}:{port}/{db}',
        driverClass: 'org.postgresql.Driver'
    },
    {
        id: 'mysql',
        name: 'MySQL',
        icon: '🐬',
        defaultPort: 3306,
        defaultDb: 'mysql',
        urlTemplate: 'jdbc:mysql://{host}:{port}/{db}',
        driverClass: 'com.mysql.cj.jdbc.Driver'
    },
    {
        id: 'clickhouse',
        name: 'ClickHouse',
        icon: '⚡',
        defaultPort: 8123,
        defaultDb: 'default',
        urlTemplate: 'jdbc:clickhouse://{host}:{port}/{db}',
        driverClass: 'com.clickhouse.jdbc.ClickHouseDriver'
    },
    {
        id: 'oracle',
        name: 'Oracle',
        icon: '🔴',
        defaultPort: 1521,
        defaultDb: 'ORCL',
        urlTemplate: 'jdbc:oracle:thin:@{host}:{port}:{db}',
        driverClass: 'oracle.jdbc.OracleDriver'
    },
];

const ConnectionModal = ({ onSave, onCancel, onTest, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        dbType: 'postgresql',
        host: 'localhost',
        port: '5432',
        database: 'postgres',
        username: 'postgres',
        password: '',
        // SSH Tunnel fields
        useSsh: false,
        sshHost: '',
        sshPort: '22',
        sshUser: '',
        sshPassword: ''
    });
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'ssh'
    const [testStatus, setTestStatus] = useState(null);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(true);

    // Fetch available drivers on mount
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const drivers = await queryPetruzApi.drivers();
                setAvailableDrivers(drivers);
                console.log('Available drivers:', drivers);

                // If no drivers available, show warning
                if (drivers.length === 0) {
                    console.warn('No JDBC drivers found in drivers/ folder');
                }
            } catch (error) {
                console.error('Failed to fetch available drivers:', error);
                setAvailableDrivers([]);
            } finally {
                setLoadingDrivers(false);
            }
        };

        fetchDrivers();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                dbType: initialData.dbType || 'postgresql',
                host: initialData.host || 'localhost',
                port: initialData.port || '5432',
                database: initialData.database || 'postgres',
                // Load SSH fields if present, defaulting for new/legacy records
                useSsh: initialData.useSsh || false,
                sshHost: initialData.sshHost || '',
                sshPort: initialData.sshPort || '22',
                sshUser: initialData.sshUser || '',
                sshPassword: initialData.sshPassword || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;

        if (name === 'dbType') {
            // When database type changes, update port and database to defaults
            const dbConfig = DATABASE_TYPES.find(db => db.id === value);
            setFormData({
                ...formData,
                dbType: value,
                port: dbConfig.defaultPort.toString(),
                database: dbConfig.defaultDb
            });
        } else {
            setFormData({ ...formData, [name]: finalValue });
        }
    };

    const buildConnectionData = () => {
        const dbConfig = DATABASE_TYPES.find(db => db.id === formData.dbType);
        if (!dbConfig) {
            alert('Database type not recognized');
            return null;
        }

        const url = dbConfig.urlTemplate
            .replace('{host}', formData.host)
            .replace('{port}', formData.port)
            .replace('{db}', formData.database);

        return {
            name: formData.name,
            url,
            username: formData.username,
            password: formData.password,
            driverClassName: dbConfig.driverClass,
            // Store these for future edits
            dbType: formData.dbType,
            host: formData.host,
            port: formData.port,
            database: formData.database,
            // SSH Data
            useSsh: formData.useSsh,
            sshHost: formData.sshHost,
            sshPort: formData.sshPort,
            sshUser: formData.sshUser,
            sshPassword: formData.sshPassword
        };
    };

    const handleTest = async () => {
        const connData = buildConnectionData();
        if (!connData) return;

        setTestStatus({ success: false, message: 'Testing...' });
        try {
            const result = await onTest(connData);
            setTestStatus(result);
        } catch (err) {
            // Extract detailed error message from response
            let errorMessage = 'Test failed';
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setTestStatus({
                success: false,
                message: 'Connection test failed',
                error: errorMessage,
                details: err.response?.data
            });
        }
    };

    const handleSave = () => {
        const connData = buildConnectionData();
        if (connData) {
            onSave(connData);
        }
    };

    const selectedDb = DATABASE_TYPES.find(db => db.id === formData.dbType);

    const availableDriverCount = availableDrivers.filter(driver => driver.available).length;
    const selectedDriverAvailable = availableDrivers.some(driver =>
        driver.databaseType === formData.dbType && driver.available
    );
    const visibleDatabaseTypes = DATABASE_TYPES.filter(database =>
        availableDrivers.some(driver => driver.databaseType === database.id && driver.available)
        // Keep the currently selected type visible even if its driver isn't detected yet, so an existing
        // connection being edited never loses its value while the driver list is (re)loading.
        || database.id === formData.dbType
    );

    useEffect(() => {
        // Never auto-switch the type of a connection that already exists: doing so was silently
        // overwriting dbType/port/database while editing, right after the driver list loaded.
        if (initialData) return;
        if (!loadingDrivers && !visibleDatabaseTypes.some(database => database.id === formData.dbType)) {
            const firstAvailableDatabase = visibleDatabaseTypes[0];
            if (firstAvailableDatabase) {
                setFormData(current => ({
                    ...current,
                    dbType: firstAvailableDatabase.id,
                    port: firstAvailableDatabase.defaultPort.toString(),
                    database: firstAvailableDatabase.defaultDb,
                }));
            }
        }
    }, [loadingDrivers, availableDrivers, initialData]);

    return (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
            <div className="bg-modal-bg border border-modal-border rounded-lg shadow-xl w-96 max-h-[90vh] flex flex-col">
                <div className="p-6 pb-0 flex-shrink-0">
                    <h2 className="text-xl font-bold text-modal-text mb-4">
                        {initialData ? 'Edit Connection' : 'New Connection'}
                    </h2>

                    {/* Tabs */}
                    <div className="flex border-b border-modal-border mb-4">
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                                    ? 'text-modal-text border-blue-500'
                                    : 'text-modal-text-muted border-transparent hover:text-modal-text'
                                }`}
                            onClick={() => setActiveTab('general')}
                        >
                            General
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ssh'
                                    ? 'text-modal-text border-blue-500'
                                    : 'text-modal-text-muted border-transparent hover:text-modal-text'
                                }`}
                            onClick={() => setActiveTab('ssh')}
                        >
                            SSH Tunnel
                        </button>
                    </div>
                </div>

                <div className="p-6 pt-0 overflow-y-auto flex-grow">
                    <div className="space-y-4">
                        {activeTab === 'general' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-modal-text-muted mb-1">Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                        placeholder="My Database"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-modal-text-muted mb-1">Database Type</label>
                                    <select
                                        name="dbType"
                                        value={formData.dbType}
                                        onChange={handleChange}
                                        className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                    >
                                        {visibleDatabaseTypes.map(db => (
                                            <option key={db.id} value={db.id}>
                                                {db.icon} {db.name}
                                            </option>
                                        ))}
                                    </select>
                                    {!loadingDrivers && (
                                        <p className="text-xs text-modal-text-muted mt-1">
                                            {selectedDriverAvailable ? 'Driver available.' : `${availableDriverCount} driver(s) available. Import the selected driver from Connection menu if needed.`}
                                        </p>
                                    )}
                                    {!loadingDrivers && visibleDatabaseTypes.length === 0 && (
                                        <p className="text-xs text-modal-text-muted mt-1">No supported JDBC driver is installed yet.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-modal-text-muted mb-1">Host</label>
                                        <input
                                            name="host"
                                            value={formData.host}
                                            onChange={handleChange}
                                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                            placeholder="localhost"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-modal-text-muted mb-1">Port</label>
                                        <input
                                            name="port"
                                            value={formData.port}
                                            onChange={handleChange}
                                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                            placeholder={selectedDb?.defaultPort.toString()}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-modal-text-muted mb-1">Database</label>
                                    <input
                                        name="database"
                                        value={formData.database}
                                        onChange={handleChange}
                                        className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                        placeholder={selectedDb?.defaultDb}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-modal-text-muted mb-1">Username</label>
                                    <input
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-modal-text-muted mb-1">Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {selectedDb && (
                                    <div className="text-xs text-modal-text-muted bg-modal-input-bg p-2 rounded">
                                        <div><strong>Driver:</strong> {selectedDb.driverClass}</div>
                                        <div><strong>URL:</strong> {selectedDb.urlTemplate
                                            .replace('{host}', formData.host)
                                            .replace('{port}', formData.port)
                                            .replace('{db}', formData.database)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'ssh' && (
                            <>
                                <div className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        id="useSsh"
                                        name="useSsh"
                                        checked={formData.useSsh}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    <label htmlFor="useSsh" className="text-sm font-medium text-modal-text select-none">
                                        Use SSH Tunnel
                                    </label>
                                </div>

                                <div className={`space-y-4 ${!formData.useSsh ? 'opacity-50' : ''}`}>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-modal-text-muted mb-1">SSH Host</label>
                                            <input
                                                name="sshHost"
                                                value={formData.sshHost}
                                                onChange={handleChange}
                                                disabled={!formData.useSsh}
                                                className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                                placeholder="ssh.example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-modal-text-muted mb-1">Port</label>
                                            <input
                                                name="sshPort"
                                                value={formData.sshPort}
                                                onChange={handleChange}
                                                disabled={!formData.useSsh}
                                                className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                                placeholder="22"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-modal-text-muted mb-1">SSH Username</label>
                                        <input
                                            name="sshUser"
                                            value={formData.sshUser}
                                            onChange={handleChange}
                                            disabled={!formData.useSsh}
                                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                            placeholder="username"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-modal-text-muted mb-1">SSH Password</label>
                                        <input
                                            name="sshPassword"
                                            type="password"
                                            value={formData.sshPassword}
                                            onChange={handleChange}
                                            disabled={!formData.useSsh}
                                            className="w-full bg-modal-input-bg border border-modal-input-border rounded px-3 py-2 text-modal-input-text focus:outline-none focus:border-blue-500"
                                            placeholder="password"
                                        />
                                    </div>

                                    <div className="text-xs text-modal-text-muted bg-modal-input-bg p-2 rounded">
                                        <div><strong>Note:</strong> SSH Tunnel will be established before connecting to the database.</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {testStatus && (
                        <div className={`mt-4 p-3 rounded text-sm ${testStatus.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                            <div className={testStatus.success ? 'text-green-400' : 'text-red-400'}>
                                <strong>{testStatus.message}</strong>
                            </div>
                            {testStatus.error && (
                                <div className="text-red-300 mt-2 text-xs">
                                    <strong>Error:</strong> {testStatus.error}
                                </div>
                            )}
                            {testStatus.details?.errorType && (
                                <div className="text-red-300 mt-1 text-xs">
                                    <strong>Type:</strong> {testStatus.details.errorType}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 pt-0 mt-auto flex justify-end gap-2">
                    <button
                        onClick={handleTest}
                        className="px-4 py-2 bg-modal-button-secondary-bg hover:bg-modal-button-secondary-hover text-modal-button-secondary-text border border-modal-input-border rounded text-sm font-medium transition-colors"
                    >
                        Test
                    </button>
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

export default ConnectionModal;
