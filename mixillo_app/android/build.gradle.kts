import com.android.build.gradle.LibraryExtension

allprojects {
    repositories {
        // Use standard repositories; vendored AARs no longer required
        google()
        mavenCentral()
        maven { url = uri("https://www.jitpack.io") }
    }
}

val newBuildDir: Directory = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Cleanup: no special overrides for old ffmpeg_kit_flutter modules needed

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
