package com.querypetruz

import kotlin.test.Test
import kotlin.test.assertEquals
import java.nio.file.Files

class ExportServiceTest {
    @Test
    fun `csv neutralizes spreadsheet formulas`() {
        val file = Files.createTempFile("query-petruz", ".csv")
        ExportService.csv(QueryResult(listOf("value"), listOf(listOf("=SUM(A1:A2)"))), file)
        assertEquals("\"value\"\n\"'=SUM(A1:A2)\"\n", Files.readString(file))
    }
}
