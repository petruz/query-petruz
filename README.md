# Query Petruz

Query Petruz is a single-user desktop client for DBA database troubleshooting. It uses an Electron/React user interface derived from Query Mole and a private Kotlin/JDBC sidecar. The renderer communicates with that sidecar over standard input/output only: there is no HTTP server, browser-exposed endpoint, or local API port.

## Capabilities

- Executes arbitrary SQL on the currently connected database.
- Shows results and exports them to CSV.
- Uses a maximum of 10,000 returned rows and a 60-second JDBC statement timeout by default.
- Provides a multi-level query tree with folders and saved SQL queries.
- Imports and exports query trees as JSON.
- Imports and exports JDBC/SSH connection profiles as JSON.
- Supports SSH local port forwarding with required `known_hosts` verification.
- Stores connection profiles and their passwords locally and includes them in a connection-profile export.
- Protects CSV exports from spreadsheet formula injection.

## Requirements

- JDK 21.
- Node.js 20+ and npm.
- No system Gradle installation is required: the committed Gradle Wrapper downloads Gradle 8.10.2 on first use.
- A JDBC driver JAR for the target database, placed in the local `drivers/` directory.
- For SSH: the target fingerprint must be in `$HOME/.ssh/known_hosts`; private key authentication is preferred.

## Run

```bash
cd /home/luca.petruzziello/git-repo/external/query-petruz
npm install
npm run dev
```

## JDBC drivers

Use **Connection > Import JDBC Driver...** and select a trusted `.jar` file. Query Petruz copies it to its private user-data directory and immediately reloads the sidecar, so restarting the application is not necessary. Open a new connection afterward to refresh the driver list.

The folder is managed by Electron and is operating-system specific: on Linux it is normally `~/.config/query-petruz/drivers`; Windows and macOS use their standard application-data locations. The project-local `drivers/` directory is retained only as a development fallback. Both locations exclude `*.jar` through `.gitignore`, so drivers are never committed with the source. A JDBC driver is executable code: only import JARs downloaded from a trusted vendor or repository.

Create an installable OS package:

```bash
npm run build
```

Run tests:

```bash
./gradlew test
```

## Basic use

1. Enter a profile name, JDBC URL, user, and password.
2. Select **Connect**. This replaces and closes the previous session, if present.
3. Write SQL in the editor and select **Run**.
4. Select **Save query** to place the current SQL in the local tree.
5. Enter a path and use **Export** / **Import queries** for `queries.json`.
6. Use **Export profile** / **Import profile** for a connection profile. Its password is deliberately omitted and must be entered after loading.
7. Select **Export CSV** after a successful result set.

## JSON formats

`queries.json` stores `version`, `nodes`, folders, query names and SQL text. A folder contains its nested `children`.

Connection profiles are stored in the local application data and exported as JSON, including the database and SSH passwords. Protect these files with operating-system account permissions and never share or commit them to source control.

## SSH profiles

The current domain model supports an optional `ssh` object in a connection profile:

```json
{
  "name": "Production through bastion",
  "jdbcUrl": "jdbc:postgresql://db.internal:5432/app",
  "username": "dba",
  "ssh": {
    "host": "bastion.example.net",
    "port": 22,
    "username": "operator",
    "remoteDatabaseHost": "db.internal",
    "remoteDatabasePort": 5432,
    "privateKeyPath": "/home/operator/.ssh/id_ed25519"
  }
}
```

Before using the profile, add the bastion host key using a trusted process, for example `ssh-keyscan` only after independently verifying the fingerprint. Query Petruz uses `StrictHostKeyChecking=yes` and rejects unknown or changed hosts.

## Security model

This tool assumes the active user is a DBA and intentionally permits destructive SQL. Its security boundary is the desktop user session: no other local process can call a web API because no web API exists. Electron uses a context-isolated preload bridge, and only the explicit connection and execution IPC methods are available to React. Protect the operating-system account, screen lock, source checkout, generated exports, and database credentials accordingly.

## Current scope

The initial Electron UI retains the Query Mole navigation tree, query editor, result views, charting, and exports. The next engineering increments should add a packaged JDBC driver catalog, native file dialogs, query cancellation, OS credential-keyring integration, a schema browser, and packaged Electron builds.
