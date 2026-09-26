const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('node:child_process');
const { copyFile, mkdir } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

let sidecar;
let nextRequestId = 1;
const pending = new Map();
// Slightly above the sidecar's own 60s statement timeout so a stuck request always surfaces an error.
const REQUEST_TIMEOUT_MS = Number(process.env.QUERY_PETRUZ_REQUEST_TIMEOUT_MS) || 90_000;

function sidecarCommand() {
    if (!app.isPackaged) {
        return {
            command: process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
            args: ['--quiet', 'runSidecar'],
            cwd: path.join(__dirname, '..'),
        };
    }
    const javaExecutable = process.platform === 'win32'
        ? path.join(process.resourcesPath, 'sidecar', 'runtime', 'bin', 'java.exe')
        : path.join(process.resourcesPath, 'sidecar', 'runtime', 'bin', 'java');
    return {
        command: process.env.QUERY_PETRUZ_JAVA || javaExecutable,
        args: ['-jar', path.join(process.resourcesPath, 'sidecar', 'query-petruz-sidecar.jar')],
        cwd: app.getPath('userData'),
    };
}

function startSidecar() {
    const sidecarProcess = sidecarCommand();
    sidecar = spawn(sidecarProcess.command, sidecarProcess.args, {
        cwd: sidecarProcess.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, QUERY_PETRUZ_DRIVERS_DIR: path.join(app.getPath('userData'), 'drivers') },
    });
    readline.createInterface({ input: sidecar.stdout }).on('line', (line) => {
        let response;
        try {
            response = JSON.parse(line);
        } catch (_) {
            // Gradle/JVM startup logs are expected on stdout in dev mode; only warn if it looks
            // like a truncated/malformed protocol message so real issues aren't silently lost.
            if (!app.isPackaged && line.trimStart().startsWith('{')) console.warn(`[sidecar] Failed to parse line as JSON: ${line}`);
            return;
        }
        const request = pending.get(response.id);
        if (!request) return;
        pending.delete(response.id);
        response.error ? request.reject(new Error(response.error)) : request.resolve(response.result);
    });
    sidecar.stderr.on('data', (data) => console.error(`[sidecar] ${data}`));
    sidecar.on('error', (error) => {
        dialog.showErrorBox('Query Petruz sidecar failed to start', `${error.message}\n\nThe packaged app includes a Java runtime. In development, install Java 21 or set QUERY_PETRUZ_JAVA to a Java executable.`);
    });
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
        const timeout = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`Sidecar request "${method}" timed out after ${REQUEST_TIMEOUT_MS}ms.`));
        }, REQUEST_TIMEOUT_MS);
        pending.set(id, {
            resolve: (result) => { clearTimeout(timeout); resolve(result); },
            reject: (error) => { clearTimeout(timeout); reject(error); },
        });
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
        show: false,
        webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
    });
    window.setMenuBarVisibility(false);
    // On some Linux window managers/compositors a freshly created window is shown but never
    // granted real OS keyboard focus (WM "focus stealing prevention"), so keystrokes keep going
    // to whatever app had focus before (e.g. the IDE) until the user alt-tabs away and back.
    // Force focus repeatedly across the window lifecycle to work around this.
    const forceFocus = () => {
        if (window.isDestroyed()) return;
        app.focus({ steal: true });
        window.focus();
        window.webContents.focus();
    };
    window.once('ready-to-show', () => {
        window.show();
        forceFocus();
        // Some WMs only honor the focus request once the window has actually been mapped.
        setTimeout(forceFocus, 300);
        // As a last resort, replicate what actually fixes it manually (alt-tab away and back):
        // briefly minimize/restore the window so the WM is forced to hand it real input focus.
        setTimeout(() => {
            if (window.isDestroyed()) return;
            window.minimize();
            window.restore();
            forceFocus();
        }, 600);
    });
    window.webContents.once('did-finish-load', forceFocus);
    const developmentUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
    if (app.isPackaged) window.loadFile(path.join(app.getAppPath(), 'dist', 'renderer', 'index.html'));
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