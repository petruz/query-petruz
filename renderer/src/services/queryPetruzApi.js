const invoke = (method, params = {}) => {
    if (!window.queryPetruz) throw new Error('Query Petruz desktop bridge is unavailable. Start the app with Electron.')
    return window.queryPetruz.invoke(method, params)
}

export const queryPetruzApi = {
    drivers: () => invoke('connection:drivers'),
    connect: (connection) => invoke('connection:connect', connection),
    testConnection: (connection) => invoke('connection:test', connection),
    execute: (sql) => invoke('query:execute', { sql }),
    importJdbcDriver: () => {
        if (!window.queryPetruz?.importJdbcDriver) throw new Error('Query Petruz desktop bridge is unavailable.')
        return window.queryPetruz.importJdbcDriver()
    },
}