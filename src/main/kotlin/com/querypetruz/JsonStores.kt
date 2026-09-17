package com.querypetruz

import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import java.nio.file.Files
import java.nio.file.Path

private val json = Json { prettyPrint = true; ignoreUnknownKeys = false }

object QueryTreeStore {
    fun load(path: Path): QueryTreeDocument = json.decodeFromString(Files.readString(path))
    fun save(path: Path, document: QueryTreeDocument) = Files.writeString(path, json.encodeToString(document))
}

object ConnectionProfileStore {
    fun load(path: Path): ConnectionDocument = json.decodeFromString(Files.readString(path))
    fun save(path: Path, document: ConnectionDocument) = Files.writeString(path, json.encodeToString(document))
}
