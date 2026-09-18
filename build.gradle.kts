plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    application
}

group = "com.querypetruz"
version = "1.0.0"
val embeddedRuntimeDir = layout.projectDirectory.dir("dist/sidecar/runtime")

repositories {
    mavenCentral()
    google()
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("com.jcraft:jsch:0.1.55")
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(21)
}

sourceSets {
    main {
        kotlin.exclude("**/Main.kt")
    }
}

tasks.test {
    useJUnitPlatform()
}

application {
    mainClass = "com.querypetruz.SidecarMainKt"
}

tasks.register<JavaExec>("runSidecar") {
    group = "application"
    description = "Runs the private JSON-RPC JDBC sidecar used by Electron."
    classpath = sourceSets["main"].runtimeClasspath
    mainClass = "com.querypetruz.SidecarMainKt"
    standardInput = System.`in`
    standardOutput = System.out
    errorOutput = System.err
}

val sidecarJar by tasks.registering(Jar::class) {
    group = "distribution"
    description = "Builds the private JDBC sidecar as a runnable JAR for Electron packaging."
    archiveBaseName = "query-petruz-sidecar"
    archiveClassifier = ""
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    manifest { attributes("Main-Class" to "com.querypetruz.SidecarMainKt") }
    from(sourceSets.main.get().output)
    from({
        configurations.runtimeClasspath.get()
            .filter { it.name.endsWith(".jar") }
            .map { zipTree(it) }
    })
    exclude("META-INF/*.RSA", "META-INF/*.SF", "META-INF/*.DSA")
}

val prepareEmbeddedRuntime by tasks.registering(Exec::class) {
    group = "distribution"
    description = "Creates a minimal Java 21 runtime for the packaged Electron sidecar."
    val launcher = javaToolchains.launcherFor {
        languageVersion = JavaLanguageVersion.of(21)
    }
    doFirst {
        delete(embeddedRuntimeDir)
    }
    val jlinkExecutable = launcher.get().metadata.installationPath.file(
        if (System.getProperty("os.name").lowercase().contains("windows")) "bin/jlink.exe" else "bin/jlink"
    )
    executable = jlinkExecutable.asFile.absolutePath
    args(
        "--strip-debug",
        "--no-header-files",
        "--no-man-pages",
        "--compress=zip-6",
        "--add-modules",
        "java.base,java.sql,java.naming,java.logging,java.management,java.security.jgss,java.security.sasl,java.xml,jdk.charsets,jdk.crypto.ec,jdk.unsupported",
        "--output",
        embeddedRuntimeDir.asFile.absolutePath
    )
}

tasks.register<Copy>("prepareSidecarForElectron") {
    group = "distribution"
    description = "Copies the sidecar JAR to dist/sidecar for electron-builder extraResources."
    dependsOn(sidecarJar, prepareEmbeddedRuntime)
    from(sidecarJar)
    into(layout.projectDirectory.dir("dist/sidecar"))
    rename { "query-petruz-sidecar.jar" }
}
