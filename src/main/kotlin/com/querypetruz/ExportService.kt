package com.querypetruz

import java.nio.file.Files
import java.nio.file.Path

object ExportService {
    fun csv(result: QueryResult, path: Path) {
        Files.newBufferedWriter(path).use { writer ->
            writer.appendLine(result.columns.joinToString(",") { cell(it) })
            result.rows.forEach { row -> writer.appendLine(row.joinToString(",") { cell(it) }) }
        }
    }

    private fun cell(value: String): String {
        val safe = if (value.startsWith("=") || value.startsWith("+") || value.startsWith("-") || value.startsWith("@")) "'$value" else value
        return "\"${safe.replace("\"", "\"\"")}\""
    }
}
