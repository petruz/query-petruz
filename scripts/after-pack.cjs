const { execFileSync } = require('node:child_process');
const { readdirSync, statSync } = require('node:fs');
const path = require('node:path');

/**
 * electron-builder afterPack hook.
 * On macOS, unifies the ad-hoc signatures of the app bundle and the embedded
 * Java sidecar runtime, ensuring that macOS Sequoia Local Network Privacy (NECP)
 * treats the main application and its sidecar as a single trusted entity.
 */
exports.default = async function (context) {
    if (context.electronPlatformName !== 'darwin') return;

    const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
    const sidecarRuntime = path.join(appPath, 'Contents', 'Resources', 'sidecar', 'runtime');

    console.log(`[afterPack] Normalizing macOS codesign signatures for ${appPath}...`);

    function signRecursively(dir) {
        try {
            const entries = readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    signRecursively(fullPath);
                } else if (entry.isFile()) {
                    const isDylib = entry.name.endsWith('.dylib');
                    const stats = statSync(fullPath);
                    const isExecutable = (stats.mode & 0o111) !== 0;
                    if (isDylib || isExecutable) {
                        try {
                            execFileSync('codesign', ['--force', '--sign', '-', fullPath], { stdio: 'ignore' });
                        } catch (err) {
                            console.warn(`[afterPack] Could not sign ${fullPath}: ${err.message}`);
                        }
                    }
                }
            }
        } catch (_) {
            // Directory might not exist in non-sidecar builds
        }
    }

    signRecursively(sidecarRuntime);

    try {
        execFileSync('codesign', ['--force', '--sign', '-', appPath], { stdio: 'inherit' });
        console.log('[afterPack] Successfully re-signed macOS app bundle.');
    } catch (err) {
        console.warn(`[afterPack] Failed to re-sign app bundle: ${err.message}`);
    }
};
