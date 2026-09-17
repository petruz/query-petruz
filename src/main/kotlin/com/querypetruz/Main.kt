package com.querypetruz

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import java.nio.file.Path

private val initialTree = listOf(
    QueryNode(name = "Troubleshooting", type = NodeType.FOLDER, children = listOf(
        QueryNode(name = "Database version", type = NodeType.QUERY, sql = "SELECT version();")
    ))
)

fun main() = application {
    Window(onCloseRequest = ::exitApplication, title = "Query Petruz") {
        MaterialTheme(colorScheme = lightColorScheme(primary = androidx.compose.ui.graphics.Color(0xFF006C62))) {
            QueryPetruzApp()
        }
    }
}

@Composable
private fun QueryPetruzApp() {
    val session = remember { JdbcSession() }
    var profileName by remember { mutableStateOf("Local database") }
    var jdbcUrl by remember { mutableStateOf("jdbc:postgresql://localhost:5432/postgres") }
    var dbUser by remember { mutableStateOf("") }
    var dbPassword by remember { mutableStateOf("") }
    var sql by remember { mutableStateOf("SELECT version();") }
    var tree by remember { mutableStateOf(initialTree) }
    var result by remember { mutableStateOf<QueryResult?>(null) }
    var status by remember { mutableStateOf("Not connected") }
    var saveQueriesPath by remember { mutableStateOf("queries.json") }
    var saveConnectionsPath by remember { mutableStateOf("connections.json") }

    DisposableEffect(Unit) { onDispose { session.close() } }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Query Petruz", style = MaterialTheme.typography.headlineMedium)
        Text("Single-session database troubleshooting client", style = MaterialTheme.typography.bodyMedium)
        HorizontalDivider()
        Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(Modifier.width(270.dp).fillMaxHeight(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Saved queries", style = MaterialTheme.typography.titleMedium)
                QueryTree(tree, Modifier.weight(1f)) { node -> if (node.type == NodeType.QUERY) sql = node.sql }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { tree = tree + QueryNode(name = "New query", type = NodeType.QUERY, sql = sql) }) { Text("Save query") }
                    OutlinedButton(onClick = {
                        runCatching { QueryTreeStore.save(Path.of(saveQueriesPath), QueryTreeDocument(nodes = tree)); status = "Queries saved" }
                            .onFailure { status = "Save failed: ${it.message}" }
                    }) { Text("Export") }
                }
                OutlinedTextField(saveQueriesPath, { saveQueriesPath = it }, label = { Text("Query JSON path") }, singleLine = true)
                OutlinedButton(onClick = {
                    runCatching { tree = QueryTreeStore.load(Path.of(saveQueriesPath)).nodes; status = "Queries loaded" }
                        .onFailure { status = "Load failed: ${it.message}" }
                }) { Text("Import queries") }
            }
            Column(Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Connection", style = MaterialTheme.typography.titleMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(profileName, { profileName = it }, label = { Text("Profile") }, modifier = Modifier.weight(0.3f), singleLine = true)
                    OutlinedTextField(jdbcUrl, { jdbcUrl = it }, label = { Text("JDBC URL") }, modifier = Modifier.weight(0.7f), singleLine = true)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(dbUser, { dbUser = it }, label = { Text("User") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedTextField(dbPassword, { dbPassword = it }, label = { Text("Password (memory only)") }, modifier = Modifier.weight(1f), singleLine = true)
                    Button(onClick = {
                        runCatching { session.connect(ConnectionProfile(profileName, jdbcUrl, dbUser), ConnectionSecrets(dbPassword)); status = "Connected: $profileName" }
                            .onFailure { status = "Connection failed: ${it.message}" }
                    }) { Text("Connect") }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(saveConnectionsPath, { saveConnectionsPath = it }, label = { Text("Connection JSON path") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedButton(onClick = {
                        runCatching { ConnectionProfileStore.save(Path.of(saveConnectionsPath), ConnectionDocument(profiles = listOf(ConnectionProfile(profileName, jdbcUrl, dbUser)))); status = "Profile saved without password" }
                            .onFailure { status = "Save failed: ${it.message}" }
                    }) { Text("Export profile") }
                    OutlinedButton(onClick = {
                        runCatching {
                            val profile = ConnectionProfileStore.load(Path.of(saveConnectionsPath)).profiles.first()
                            profileName = profile.name; jdbcUrl = profile.jdbcUrl; dbUser = profile.username; status = "Profile loaded; enter password"
                        }.onFailure { status = "Load failed: ${it.message}" }
                    }) { Text("Import profile") }
                }
                Text("SQL", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(sql, { sql = it }, modifier = Modifier.fillMaxWidth().height(190.dp), textStyle = LocalTextStyle.current.copy(fontFamily = FontFamily.Monospace))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Button(onClick = {
                        runCatching { result = session.execute(sql); status = "Query completed" }
                            .onFailure { status = "Execution failed: ${it.message}" }
                    }) { Text("Run") }
                    OutlinedButton(enabled = result != null, onClick = {
                        runCatching { ExportService.csv(requireNotNull(result), Path.of("query-results.csv")); status = "Exported query-results.csv" }
                            .onFailure { status = "Export failed: ${it.message}" }
                    }) { Text("Export CSV") }
                    Text(status, style = MaterialTheme.typography.bodySmall)
                }
                ResultTable(result, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun QueryTree(nodes: List<QueryNode>, modifier: Modifier = Modifier, onQuerySelected: (QueryNode) -> Unit) {
    val visibleNodes = remember(nodes) { flattenTree(nodes) }
    LazyColumn(modifier.fillMaxWidth()) {
        items(visibleNodes, key = { it.node.id }) { item ->
            val node = item.node
            Text("${if (node.type == NodeType.FOLDER) "[Folder]" else "[Query]"} ${node.name}", Modifier.fillMaxWidth().clickable { onQuerySelected(node) }.padding(start = (item.depth * 16).dp, top = 5.dp, bottom = 5.dp))
        }
    }
}

private data class VisibleNode(val node: QueryNode, val depth: Int)

private fun flattenTree(nodes: List<QueryNode>, depth: Int = 0): List<VisibleNode> =
    nodes.flatMap { node -> listOf(VisibleNode(node, depth)) + flattenTree(node.children, depth + 1) }

@Composable
private fun ResultTable(result: QueryResult?, modifier: Modifier = Modifier) {
    if (result == null) return Box(modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Text("Results will appear here") }
    LazyColumn(modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant).padding(8.dp)) {
        item { Text(result.columns.joinToString(" | "), fontFamily = FontFamily.Monospace) }
        items(result.rows) { row -> Text(row.joinToString(" | "), fontFamily = FontFamily.Monospace) }
        if (result.truncated) item { Text("Result truncated at configured row limit.") }
    }
}
