/**
 * 应用主页面
 */

import { webview } from '@kit.ArkWeb';
import { DoubleBackExit } from '../common/DoubleBackExit';
import { AppWebView } from '../components/webview/AppWebView';

@Entry
@Component
struct Index {
  private webViewController: webview.WebviewController = new webview.WebviewController(); // WebView 控制器
  private doubleBackExit: DoubleBackExit = new DoubleBackExit(); // 两次返回退出处理

  build() {
    Column() {
      AppWebView({ controller: this.webViewController })
    }
    .width('100%')
    .height('100%')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }

  /**
   * 系统返回键拦截
   *
   * @returns true = 已消费事件阻止退出，false = 交由系统退出应用
   */
  onBackPress(): boolean {
    // WebView 内部回退
    try {
      if (this.webViewController.accessBackward()) {
        this.webViewController.backward();
        return true;
      }
    } catch (err) {
    }

    // 两次返回退出处理
    if (!this.doubleBackExit.shouldExit()) {
      return true;
    }

    return false;
  }
}