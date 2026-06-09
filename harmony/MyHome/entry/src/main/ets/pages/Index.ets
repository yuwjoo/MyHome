/**
 * 应用主页面
 */

import { router } from '@kit.ArkUI';
import { webview } from '@kit.ArkWeb';
import { DoubleBackExit } from '../common/DoubleBackExit';
import { AppWebView } from '../components/AppWebView';
import { VersionUpdater } from '../common/versionUpdate/VersionUpdater';
import { ENV } from 'entry/BuildProfile';

@Entry
@Component
struct Index {
  private wvController: webview.WebviewController =
    new webview.WebviewController();
  private doubleBackExit: DoubleBackExit = new DoubleBackExit();
  private needRefresh: boolean = false; // 从更新页返回后需刷新 WebView

  aboutToAppear(): void {
    if (ENV === 'debug') {
      webview.WebviewController.setWebDebuggingAccess(true)
    }
    this.checkVersionAndNavigate();
  }

  build() {
    Column() {
      AppWebView({ controller: this.wvController })
    }
    .width('100%')
    .height('100%')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }

  /**
   * 从更新页面返回时刷新 WebView
   */
  onPageShow(): void {
    if (this.needRefresh) {
      this.needRefresh = false;
      try {
        this.wvController.refresh();
      } catch (_e) {
      }
    }
  }

  /**
   * 后台检查版本，有新版本则跳转更新页面
   */
  private async checkVersionAndNavigate(): Promise<void> {
    const updater = new VersionUpdater(getContext(this));
    const hasNew = await updater.hasNewWebVersion();

    if (!hasNew) {
      return;
    }

    this.needRefresh = true;

    router.pushUrl({
      url: 'pages/UpdatePage',
    }).catch((_e: Error) => {
      this.needRefresh = false;
    });
  }

  /**
   * 系统返回键拦截
   *
   * @returns true = 已消费事件阻止退出，false = 交由系统退出应用
   */
  onBackPress(): boolean {
    try {
      if (this.wvController.accessBackward()) {
        this.wvController.backward();
        return true;
      }
    } catch (err) {
    }

    if (!this.doubleBackExit.shouldExit()) {
      return true;
    }

    return false;
  }
}
