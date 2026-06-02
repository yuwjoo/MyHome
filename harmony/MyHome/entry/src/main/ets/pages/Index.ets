/**
 * 应用主页面
 */

import { webview } from '@kit.ArkWeb';
import { DoubleBackExit } from '../common/DoubleBackExit';
import { AppWebView } from '../components/AppWebView';
import { UpdateOverlay } from '../components/UpdateOverlay';
import { VersionUpdater } from '../common/versionUpdate/VersionUpdater';
import { UpdateStatus } from '../common/versionUpdate/UpdateStatus';

@Entry
@Component
struct Index {
  private webViewController: webview.WebviewController =
    new webview.WebviewController();
  private doubleBackExit: DoubleBackExit = new DoubleBackExit();

  @State isUpdating: boolean = false; // 是否正在更新（控制弹窗显隐）
  @State updateStatus: UpdateStatus = UpdateStatus.CHECKING; // 更新状态
  @State updateMessage: string = ''; // 状态提示文本
  @State updateProgress: number = 0; // 下载进度（0–100）

  aboutToAppear(): void {
    this.checkVersion();
  }

  build() {
    Stack() {
      AppWebView({ controller: this.webViewController })

      if (this.isUpdating) {
        UpdateOverlay({
          updateStatus: this.updateStatus,
          updateMessage: this.updateMessage,
          updateProgress: this.updateProgress,
        })
      }
    }
    .width('100%')
    .height('100%')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }

  /**
   * 后台检查版本，有新版本时弹窗展示更新进度
   */
  private async checkVersion(): Promise<void> {
    const updater = new VersionUpdater(getContext(this));
    const hasNew = await updater.hasNewWebVersion();

    if (!hasNew) {
      return;
    }

    this.isUpdating = true;
    this.updateStatus = UpdateStatus.DOWNLOADING;
    this.updateMessage = '正在更新Web资源...';

    try {
      await updater.updateWebResource();
      this.updateStatus = UpdateStatus.COMPLETE;
      this.updateMessage = '更新完成';
    } catch (_e) {
      this.updateStatus = UpdateStatus.ERROR;
      this.updateMessage = '更新失败';
    } finally {
      setTimeout(() => {
        this.isUpdating = false;
      }, 2000);
    }
  }

  /**
   * 系统返回键拦截
   *
   * @returns true = 已消费事件阻止退出，false = 交由系统退出应用
   */
  onBackPress(): boolean {
    if (this.isUpdating) {
      return true;
    }

    try {
      if (this.webViewController.accessBackward()) {
        this.webViewController.backward();
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
