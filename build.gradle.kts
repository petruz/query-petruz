import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.0"
    id("org.jetbrains.compose") version "1.7.1"
}

group = "com.querypetruz"
version = "1.0.0"

repositories {
    mavenCentral()
    google()
}

dependencies {
    implementation(compose.desktop.currentOs)
    implementation(compose.material3)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("com.jcraft:jsch:0.1.55")
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(21)
}

tasks.test {
    useJUnitPlatform()
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

compose.desktop {
    application {
        mainClass = "com.querypetruz.MainKt"
        nativeDistributions {
            targetFormats(TargetFormat.Deb, TargetFormat.Rpm, TargetFormat.Dmg, TargetFormat.Msi)
            packageName = "query-petruz"
            packageVersion = project.version.toString()
        }
    }
}
