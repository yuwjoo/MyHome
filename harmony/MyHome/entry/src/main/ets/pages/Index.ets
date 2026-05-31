/**
 * 应用主页面
 *
 * 职责：组装 WebView + 沉浸式布局 + 返回键处理
 * 依赖模块：
 *   - common/BackPressHandler — 返回键处理
 *   - webview/AppWebView      — WebView 封装组件
 */

import { webview } from '@kit.ArkWeb';

import { BackPressHandler } from '../common/BackPressHandler';
import { AppWebView } from '../webview/AppWebView';

@Entry
@Component
struct Index {
  /** WebView 控制器（@Provide 使子组件 AppWebView 可通过 @Consume 获取） */
  @Provide controller: webview.WebviewController = new webview.WebviewController();

  /** 返回键处理器（封装双重返回退出 + WebView 回退逻辑） */
  private backHandler: BackPressHandler = new BackPressHandler(this.controller);

  /** 构建页面 UI */
  build() {
    Column() {
      AppWebView()
    }
    .width('100%')
    .height('100%')
    // -- 沉浸式布局：内容延伸至状态栏和导航栏 --
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }

  /** 系统返回键拦截 */
  onBackPress(): boolean {
    return this.backHandler.onBackPress();
  }
}