package com.querypetruz

import java.net.URLClassLoader
import java.nio.file.Files
import java.nio.file.Path
import java.sql.Driver
import java.sql.DriverManager
import java.sql.DriverPropertyInfo
import java.sql.SQLException
import java.util.Properties
import java.util.ServiceLoader

/** Loads JDBC drivers deliberately installed by the local DBA in the user driver directory. */
object ExternalJdbcDrivers {
    private val registeredDrivers = mutableSetOf<String>()
    private var classLoader: URLClassLoader? = null

    fun load(directory: Path = driverDirectory()) {
        if (!Files.isDirectory(directory)) return
        val urls = Files.list(directory).use { paths ->
            paths.filter { it.fileName.toString().endsWith(".jar", ignoreCase = true) }
                .map { it.toUri().toURL() }
                .toList()
        }
        if (urls.isEmpty()) return
        classLoader = URLClassLoader(urls.toTypedArray(), ExternalJdbcDrivers::class.java.classLoader)
        ServiceLoader.load(Driver::class.java, classLoader).forEach(::register)
    }

    private fun driverDirectory(): Path = System.getenv("QUERY_PETRUZ_DRIVERS_DIR")
        ?.takeIf(String::isNotBlank)
        ?.let(Path::of)
        ?: Path.of("drivers")

    fun loadDriver(className: String) {
        if (className.isBlank()) return
        runCatching { Class.forName(className) }.getOrElse {
            val driver = Class.forName(className, true, checkNotNull(classLoader) { "Driver $className was not found in drivers/." })
                .getDeclaredConstructor().newInstance() as Driver
            register(driver)
        }
    }

    fun isAvailable(className: String): Boolean = runCatching { loadDriver(className) }.isSuccess

    private fun register(driver: Driver) {
        if (registeredDrivers.add(driver.javaClass.name)) DriverManager.registerDriver(DriverShim(driver))
    }

    private class DriverShim(private val delegate: Driver) : Driver {
        override fun acceptsURL(url: String?) = delegate.acceptsURL(url)
        override fun connect(url: String?, info: Properties?) = delegate.connect(url, info)
        override fun getMajorVersion() = delegate.majorVersion
        override fun getMinorVersion() = delegate.minorVersion
        override fun getParentLogger() = delegate.parentLogger
        override fun getPropertyInfo(url: String?, info: Properties?): Array<DriverPropertyInfo> = delegate.getPropertyInfo(url, info)
        override fun jdbcCompliant() = delegate.jdbcCompliant()
    }
}