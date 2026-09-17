package com.querypetruz

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class QueryTreeDocument(
    val version: Int = 1,
    val nodes: List<QueryNode> = emptyList()
)

@Serializable
data class QueryNode(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val type: NodeType,
    val sql: String = "",
    val children: List<QueryNode> = emptyList()
)

@Serializable
enum class NodeType { FOLDER, QUERY }

/** Secrets deliberately do not belong to this serializable profile. */
@Serializable
data class ConnectionProfile(
    val name: String,
    val jdbcUrl: String,
    val username: String = "",
    val ssh: SshProfile? = null
)

@Serializable
data class ConnectionDocument(
    val version: Int = 1,
    val profiles: List<ConnectionProfile> = emptyList()
)

@Serializable
data class SshProfile(
    val host: String,
    val port: Int = 22,
    val username: String,
    val remoteDatabaseHost: String,
    val remoteDatabasePort: Int,
    val privateKeyPath: String? = null
)

data class ConnectionSecrets(
    val databasePassword: String = "",
    val sshPassword: String = ""
)

data class QueryResult(
    val columns: List<String>,
    val rows: List<List<String>>,
    val updateCount: Int? = null,
    val truncated: Boolean = false
)
