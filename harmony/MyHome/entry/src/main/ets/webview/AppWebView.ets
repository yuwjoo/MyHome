/**
 * WebView 封装组件
 *
 * 职责：
 *   - 封装 Web 组件的初始化和所有属性配置
 *   - 提供统一的 domStorage / JavaScript / 缩放 / 混合模式等开关
 *   - 通过 @Consume 共享父组件的 WebviewController，实现导航控制
 *
 * 使用方式：
 *   父组件用 @Provide 创建控制器，AppWebView 通过 @Consume 自动注入
 *   <AppWebView />
 */

import { webview } from '@kit.ArkWeb';

import { HOME_URL } from '../common/AppConfig';

@Component
export struct AppWebView {
  /** 从父组件注入的 WebView 控制器，用于导航控制（前进/后退等） */
  @Consume controller: webview.WebviewController;

  build() {
    Web({ src: HOME_URL, controller: this.controller })
      .domStorageAccess(true)   // 开启 DOM 存储（localStorage / sessionStorage）
      .javaScriptAccess(true)   // 允许执行 JavaScript
      .mixedMode(MixedMode.All) // 允许混合内容（HTTP 与 HTTPS 共存）
      .zoomAccess(false)        // 禁止捏合缩放，保持移动端体验
      .overviewModeAccess(true) // 概览模式，自动缩放适配屏幕宽度
      .width('100%')
      .height('100%')
  }
}
