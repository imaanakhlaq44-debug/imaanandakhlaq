import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Play Store upload key: the SAME keystore the original Capacitor app was
// signed with (E:\Almas\almas_app\imaan\android\keystore.properties +
// android/app/imaanakhlaq-release.keystore). Play only accepts an update to
// com.imaanakhlaq signed with that key. The properties file is read in place
// so the passwords are never copied into this project; neither file is in Git.
// Override the location with -PreleaseKeystoreProperties=<path> if it moves.
val legacyAndroidDir = rootProject.projectDir.parentFile.parentFile.resolve("android")
val keystorePropertiesFile: File =
    (project.findProperty("releaseKeystoreProperties") as String?)?.let { file(it) }
        ?: legacyAndroidDir.resolve("keystore.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) {
        FileInputStream(keystorePropertiesFile).use { load(it) }
    }
}

android {
    namespace = "com.imaanakhlaq"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Same ID as the app already on Google Play, so this ships as its update.
        applicationId = "com.imaanakhlaq"
        minSdk = maxOf(flutter.minSdkVersion, 24)
        targetSdk = maxOf(flutter.targetSdkVersion, 36)
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                // storeFile is relative to the app/ folder next to the
                // properties file (the legacy android/app directory).
                storeFile = keystorePropertiesFile.absoluteFile.parentFile.resolve("app")
                    .resolve(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug { applicationIdSuffix = ".flutterdev" }
        getByName("profile") {
            applicationIdSuffix = ".flutterdev"
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

// Never let a store build fall back to the debug key.
gradle.taskGraph.whenReady {
    val releasing = allTasks.any { it.name.contains("Release") && it.project == project }
    if (releasing && !keystorePropertiesFile.exists()) {
        throw GradleException(
            "Release signing: ${keystorePropertiesFile} not found. " +
                "A Play Store build must use the original upload keystore.",
        )
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
