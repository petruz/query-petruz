const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('node:child_process');
const { copyFile, mkdir } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

let sidecar;
let nextRequestId = 1;
const pending = new Map();

function startSidecar() {
    const command = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    sidecar = spawn(command, ['--quiet', 'runSidecar'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, QUERY_PETRUZ_DRIVERS_DIR: path.join(app.getPath('userData'), 'drivers') },
    });
    readline.createInterface({ input: sidecar.stdout }).on('line', (line) => {
        try {
            const response = JSON.parse(line);
            const request = pending.get(response.id);
            if (!request) return;
            pending.delete(response.id);
            response.error ? request.reject(new Error(response.error)) : request.resolve(response.result);
        } catch (_) { /* Gradle output is intentionally suppressed; ignore non-protocol output. */ }
    });
    sidecar.stderr.on('data', (data) => console.error(`[sidecar] ${data}`));
    sidecar.on('exit', () => {
        for (const request of pending.values()) request.reject(new Error('Database sidecar stopped.'));
        pending.clear();
    });
}

async function importJdbcDriver() {
    const selection = await dialog.showOpenDialog({
        title: 'Import JDBC driver',
        properties: ['openFile'],
        filters: [{ name: 'JDBC driver', extensions: ['jar'] }],
    });
    if (selection.canceled) return { canceled: true };

    const driversDirectory = path.join(app.getPath('userData'), 'drivers');
    await mkdir(driversDirectory, { recursive: true });
    const source = selection.filePaths[0];
    const parsed = path.parse(source);
    let destination = path.join(driversDirectory, parsed.base);
    let suffix = 1;
    while (existsSync(destination)) destination = path.join(driversDirectory, `${parsed.name}-${suffix++}${parsed.ext}`);
    await copyFile(source, destination);
    await invoke('drivers:reload');
    return { fileName: path.basename(destination), directory: driversDirectory };
}

function invoke(method, params) {
    return new Promise((resolve, reject) => {
        const id = nextRequestId++;
        pending.set(id, { resolve, reject });
        sidecar.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    });
}

function createWindow() {
    const window = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 1000,
        minHeight: 700,
        autoHideMenuBar: true,
        webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
    });
    window.setMenuBarVisibility(false);
    const developmentUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
    if (app.isPackaged) window.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));
    else window.loadURL(developmentUrl);
}

app.whenReady().then(() => {
    startSidecar();
    ipcMain.handle('query-petruz:invoke', (_, method, params) => invoke(method, params));
    ipcMain.handle('query-petruz:import-jdbc-driver', importJdbcDriver);
    createWindow();
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => sidecar?.kill());