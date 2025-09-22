import { defineConfig } from "@vue/cli-service";
import { initAutoImport, initComponents, initIcons } from "./builder/webpackPlugins.mjs";
import { toFilePath } from "./builder/utils.mjs";
import webpack from "webpack";

export default defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === "development" ? "/" : "./",
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
      }),
      initAutoImport(),
      initComponents(),
      initIcons()
    ],
    resolve: {
      alias: {
        "@": toFilePath("./src"),
        "@node_modules": toFilePath("./node_modules")
      }
    }
  },
  css: {
    loaderOptions: {
      scss: {
        additionalData: '@use "@/assets/style/variable.scss" as *;'
      }
    }
  },
  devServer: {
    port: 9000,
    client: {
      overlay: {
        runtimeErrors: false // 运行时未捕获的错误不全屏覆盖展示
      }
    }
  }
});
