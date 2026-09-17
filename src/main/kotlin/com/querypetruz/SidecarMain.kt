package com.querypetruz

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.io.BufferedReader
import java.io.InputStreamReader

private val rpcJson = Json { ignoreUnknownKeys = true }

fun main() {
    ExternalJdbcDrivers.load()
    val session = JdbcSession()
    BufferedReader(InputStreamReader(System.`in`)).useLines { lines ->
        lines.filter(String::isNotBlank).forEach { line ->
            val request = runCatching { rpcJson.parseToJsonElement(line).jsonObject }
            val response = request.fold(
                onSuccess = { handleRequest(session, it) },
                onFailure = { buildJsonObject { put("id", -1); put("error", "Invalid request: ${it.message}") } }
            )
            println(response)
            System.out.flush()
        }
    }
    session.close()
}

private fun handleRequest(session: JdbcSession, request: JsonObject): JsonObject {
    val id = request["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: -1
    return runCatching {
        val params = request["params"]?.jsonObject ?: buildJsonObject { }
        val result = when (request["method"]?.jsonPrimitive?.content) {
            "connection:drivers" -> drivers()
            "drivers:reload" -> {
                ExternalJdbcDrivers.load()
                buildJsonObject { put("success", true) }
            }
            "connection:connect" -> {
                session.connect(params.toProfile(), params.toSecrets(), params.string("driverClassName"))
                buildJsonObject { put("success", true); put("message", "Connected") }
            }
            "connection:test" -> {
                session.test(params.toProfile(), params.toSecrets(), params.string("driverClassName"))
                buildJsonObject { put("success", true); put("message", "Connection successful") }
            }
            "query:execute" -> execute(session, params.string("sql"))
            else -> error("Unsupported sidecar method.")
        }
        buildJsonObject { put("id", id); put("result", result) }
    }.getOrElse { error -> buildJsonObject { put("id", id); put("error", error.message ?: error.javaClass.simpleName) } }
}

private fun drivers(): JsonArray = buildJsonArray {
    add(buildJsonObject { put("databaseType", "postgresql"); put("displayName", "PostgreSQL"); put("driverClassName", "org.postgresql.Driver"); put("available", isDriverAvailable("org.postgresql.Driver")) })
    add(buildJsonObject { put("databaseType", "mysql"); put("displayName", "MySQL"); put("driverClassName", "com.mysql.cj.jdbc.Driver"); put("available", isDriverAvailable("com.mysql.cj.jdbc.Driver")) })
    add(buildJsonObject { put("databaseType", "clickhouse"); put("displayName", "ClickHouse"); put("driverClassName", "com.clickhouse.jdbc.ClickHouseDriver"); put("available", isDriverAvailable("com.clickhouse.jdbc.ClickHouseDriver")) })
    add(buildJsonObject { put("databaseType", "oracle"); put("displayName", "Oracle"); put("driverClassName", "oracle.jdbc.OracleDriver"); put("available", isDriverAvailable("oracle.jdbc.OracleDriver")) })
}

private fun isDriverAvailable(className: String) = ExternalJdbcDrivers.isAvailable(className)

private fun execute(session: JdbcSession, sql: String): JsonObject {
    val startedAt = System.nanoTime()
    val result = session.execute(sql)
    return buildJsonObject {
        put("success", true)
        put("columns", buildJsonArray { result.columns.forEach { add(JsonPrimitive(it)) } })
        put("rows", buildJsonArray {
            result.rows.forEach { row ->
                add(buildJsonObject { result.columns.zip(row).forEach { (column, value) -> put(column, value) } })
            }
        })
        result.updateCount?.let { put("updateCount", it) }
        put("truncated", result.truncated)
        put("executionTimeMs", (System.nanoTime() - startedAt) / 1_000_000)
    }
}

private fun JsonObject.toProfile() = ConnectionProfile(
    name = string("name"),
    jdbcUrl = string("url"),
    username = string("username"),
    ssh = if (boolean("useSsh")) SshProfile(
        host = string("sshHost"),
        port = string("sshPort", "22").toInt(),
        username = string("sshUser"),
        remoteDatabaseHost = string("host"),
        remoteDatabasePort = string("port").toInt(),
    ) else null
)

private fun JsonObject.toSecrets() = ConnectionSecrets(string("password"), string("sshPassword"))
private fun JsonObject.string(name: String, default: String = "") = this[name]?.jsonPrimitive?.content ?: default
private fun JsonObject.boolean(name: String) = this[name]?.jsonPrimitive?.content?.toBoolean() ?: false