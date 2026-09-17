const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('queryPetruz', {
    invoke: (method, params) => ipcRenderer.invoke('query-petruz:invoke', method, params),
    importJdbcDriver: () => ipcRenderer.invoke('query-petruz:import-jdbc-driver'),
});