plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.yuwjoo.myhome"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = "com.yuwjoo.myhome"
        minSdk = 24
        targetSdk = 36
        versionCode = 32
        versionName = "0.0.32"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        // 覆盖默认的 debug 签名，确保 Run 按钮也使用自定义证书
        getByName("debug") {
            storeFile = file("../../my-home-key")
            storePassword = "yuwjoo:my-home-2026"
            keyAlias = "my-home"
            keyPassword = "yuwjoo:my-home-2026"
        }
        create("release") {
            storeFile = file("../../my-home-key")
            storePassword = "yuwjoo:my-home-2026"
            keyAlias = "my-home"
            keyPassword = "yuwjoo:my-home-2026"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
            buildConfigField("boolean", "IS_RELEASE", "true")
        }
        debug {
            buildConfigField("boolean", "IS_RELEASE", "false")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.core.ktx)
    implementation(libs.material)
    implementation(libs.okhttp)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.androidx.webkit)
    implementation(libs.paho.mqtt.client)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
}