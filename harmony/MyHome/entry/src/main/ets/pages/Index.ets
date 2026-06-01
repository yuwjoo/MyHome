/**
 * 应用主页面
 */

import { webview } from '@kit.ArkWeb';
import { DoubleBackExit } from '../common/DoubleBackExit';
import { AppWebView } from '../components/AppWebView';
import { UpdateOverlay } from '../components/UpdateOverlay';
import { VersionChecker } from '../common/versionUpdate/VersionChecker';
import { UpdateStatus } from '../common/versionUpdate/UpdateStatus';
import { WebResourceUpdater } from '../common/versionUpdate/WebResourceUpdater';

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
    const checker = new VersionChecker(getContext(this));
    const newVersion = await checker.hasNewWebVersion();

    if (newVersion === null) {
      return;
    }

    this.isUpdating = true;

    const updater = new WebResourceUpdater(getContext(this));

    updater.onStatusChange = (status: UpdateStatus, message: string) => {
      this.updateStatus = status;
      this.updateMessage = message;

      if (status === UpdateStatus.COMPLETE ||
          status === UpdateStatus.ERROR) {
        setTimeout(() => {
          this.isUpdating = false;
        }, status === UpdateStatus.COMPLETE ? 1200 : 2000);
      }
    };

    updater.onProgress = (percent: number) => {
      this.updateProgress = percent;
    };

    await updater.update(newVersion);
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
