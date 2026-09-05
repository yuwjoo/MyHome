plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.yuwjoo.myhomerecipe"
    compileSdk {
        version = release(37)
    }

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = "com.yuwjoo.myhomerecipe"
        minSdk = 24
        targetSdk = 37
        versionCode = 2
        versionName = "0.0.2"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        // 覆盖默认 debug 签名，保证 debug / release 之间可以无缝覆盖安装
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
        debug {
            buildConfigField("boolean", "IS_RELEASE", "false")
        }
        release {
            // 菜谱 Web 资源体积小且本地更新走自研 updater，关闭 R8 优化以简化构建
            optimization {
                enable = false
            }
            buildConfigField("boolean", "IS_RELEASE", "true")
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.webkit)
    implementation(libs.okhttp)
    implementation(libs.kotlinx.coroutines.android)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
