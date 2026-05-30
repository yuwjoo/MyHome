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
    },
    module: {
      rules: [
        {
          test: /\.worker\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: ["worker-loader", "ts-loader"]
        }
      ]
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
    port: 5173,
    client: {
      overlay: false
    }
  }
});
