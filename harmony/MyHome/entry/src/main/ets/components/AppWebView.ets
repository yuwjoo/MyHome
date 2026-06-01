/**
 * WebView 封装组件
 */

import { webview } from '@kit.ArkWeb';
import { WEB_HOME_URL } from '../common/config/BaseConfig';

@Component
export struct AppWebView {
 @Prop controller: webview.WebviewController; // WebView 控制器

  build() {
    Web({ src: WEB_HOME_URL, controller: this.controller })
      .domStorageAccess(true)   // 开启 DOM 存储（localStorage / sessionStorage）
      .javaScriptAccess(true)   // 允许执行 JavaScript
      .mixedMode(MixedMode.All) // 允许混合内容（HTTP 与 HTTPS 共存）
      .zoomAccess(false)        // 禁止捏合缩放，保持移动端体验
      .overviewModeAccess(true) // 概览模式，自动缩放适配屏幕宽度
      .width('100%')
      .height('100%')
  }
}
