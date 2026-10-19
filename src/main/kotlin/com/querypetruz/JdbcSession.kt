package com.querypetruz

import com.jcraft.jsch.JSch
import com.jcraft.jsch.Session
import java.net.ServerSocket
import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.util.Properties
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/** One application instance owns exactly one JDBC connection and optional SSH tunnel. */
class JdbcSession {
    private data class Tunnel(val session: Session, val localPort: Int)

    private val lock = ReentrantLock()
    private var connection: Connection? = null
    private var sshSession: Session? = null

    fun connect(profile: ConnectionProfile, secrets: ConnectionSecrets, driverClassName: String? = null) = lock.withLock {
        closeLocked()
        driverClassName?.let(ExternalJdbcDrivers::loadDriver)
        val jdbcUrl = profile.ssh?.let { ssh ->
            val tunnel = openTunnel(ssh, secrets.sshPassword)
            sshSession = tunnel.session
            rewriteJdbcUrl(profile.jdbcUrl, tunnel.localPort)
        } ?: profile.jdbcUrl
        val properties = Properties().apply { put("user", profile.username); put("password", secrets.databasePassword) }
        try {
            connection = DriverManager.getConnection(jdbcUrl, properties)
        } catch (e: Exception) {
            closeLocked()
            throw e
        }
    }

    fun test(profile: ConnectionProfile, secrets: ConnectionSecrets, driverClassName: String? = null) = lock.withLock {
        driverClassName?.let(ExternalJdbcDrivers::loadDriver)
        val properties = Properties().apply { put("user", profile.username); put("password", secrets.databasePassword) }
        if (profile.ssh == null) DriverManager.getConnection(profile.jdbcUrl, properties).use { }
        else {
            val tunnel = openTunnel(profile.ssh, secrets.sshPassword)
            try {
                DriverManager.getConnection(rewriteJdbcUrl(profile.jdbcUrl, tunnel.localPort), properties).use { }
            } finally {
                runCatching { tunnel.session.disconnect() }
            }
        }
    }

    fun execute(sql: String, maxRows: Int = 10_000, timeoutSeconds: Int = 60): QueryResult = lock.withLock {
        val activeConnection = checkNotNull(connection) { "Connect to a database before executing a query." }
        activeConnection.createStatement().use { statement ->
            statement.queryTimeout = timeoutSeconds
            statement.maxRows = maxRows + 1
            if (!statement.execute(sql)) return QueryResult(emptyList(), emptyList(), statement.updateCount)
            statement.resultSet.use { resultSet ->
                val metadata = resultSet.metaData
                val columns = (1..metadata.columnCount).map(metadata::getColumnLabel)
                val rows = buildList {
                    while (resultSet.next() && size <= maxRows) add((1..metadata.columnCount).map { index -> resultSet.getString(index) ?: "" })
                }
                QueryResult(columns, rows.take(maxRows), truncated = rows.size > maxRows)
            }
        }
    }

    fun close() = lock.withLock { closeLocked() }

    private fun openTunnel(ssh: SshProfile, password: String): Tunnel {
        val jsch = JSch()
        val knownHosts = System.getProperty("user.home") + "/.ssh/known_hosts"
        jsch.setKnownHosts(knownHosts)
        ssh.privateKeyPath?.let(jsch::addIdentity)
        val session = jsch.getSession(ssh.username, ssh.host, ssh.port).apply {
            if (password.isNotBlank()) setPassword(password)
            setConfig("StrictHostKeyChecking", "yes")
            connect(15_000)
        }
        val localPort = ServerSocket(0).use { it.localPort }
        session.setPortForwardingL("127.0.0.1", localPort, ssh.remoteDatabaseHost, ssh.remoteDatabasePort)
        return Tunnel(session, localPort)
    }

    private fun rewriteJdbcUrl(url: String, port: Int): String =
        Regex("^(jdbc:[^:]+://)([^/:]+)(?::\\d+)?(/.*)$").replace(url) { "${it.groupValues[1]}127.0.0.1:$port${it.groupValues[3]}" }

    private fun closeLocked() {
        runCatching { connection?.close() }
        connection = null
        runCatching { sshSession?.disconnect() }
        sshSession = null
    }
}
