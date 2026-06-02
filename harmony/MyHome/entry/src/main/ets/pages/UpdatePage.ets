/**
 * 版本更新页面
 */

import { router } from '@kit.ArkUI';
import { VersionUpdater } from '../common/versionUpdate/VersionUpdater';
import { UpdateStatus } from '../common/versionUpdate/UpdateStatus';

@Entry
@Component
struct UpdatePage {
  private updater: VersionUpdater = new VersionUpdater(getContext(this)); // 更新控制器
  @State status: UpdateStatus = UpdateStatus.DOWNLOADING; // 当前更新阶段
  @State message: string = '正在准备更新...'; // 状态提示文本
  @State progress: number = 0; // 下载进度（0–100）

  aboutToAppear(): void {
    this.startUpdate();
  }

  build() {
    Column() {
      Column() {
        if (this.status === UpdateStatus.ERROR) {
          this.errorView()
        } else if (this.status === UpdateStatus.COMPLETE) {
          this.completeView()
        } else {
          this.progressView()
        }
      }
      .width('80%')
      .padding(28)
      .borderRadius(16)
      .backgroundColor('#FFFFFF')
      .shadow({
        radius: 20,
        color: 'rgba(0,0,0,0.12)',
        offsetY: 6,
      })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .backgroundColor('#F5F5F5')
  }

  @Builder
  progressView() {
    LoadingProgress()
      .width(48)
      .height(48)
      .color('#2196F3')
      .margin({ bottom: 16 })

    Text(this.message)
      .fontSize(16)
      .fontColor('#333333')
      .textAlign(TextAlign.Center)
      .margin({ bottom: 20 })

    if (this.status === UpdateStatus.DOWNLOADING) {
      Progress({
        value: this.progress,
        total: 100,
        type: ProgressType.Linear,
      })
        .width('100%')
        .height(6)
        .style({ strokeWidth: 6 })
        .color('#2196F3')

      Text(`${this.progress}%`)
        .fontSize(14)
        .fontColor('#999999')
        .margin({ top: 8 })
    }
  }

  @Builder
  completeView() {
    Text('✓')
      .fontSize(48)
      .fontColor('#4CAF50')
      .margin({ bottom: 16 })

    Text('更新完成')
      .fontSize(16)
      .fontColor('#333333')
      .margin({ bottom: 6 })

    Text('即将返回首页')
      .fontSize(13)
      .fontColor('#999999')
  }

  @Builder
  errorView() {
    Text('✗')
      .fontSize(48)
      .fontColor('#FF5252')
      .margin({ bottom: 16 })

    Text(this.message)
      .fontSize(16)
      .fontColor('#333333')
      .textAlign(TextAlign.Center)
      .margin({ bottom: 24 })

    Flex({ wrap: FlexWrap.NoWrap, justifyContent: FlexAlign.Center }) {
      Button('重试')
        .fontSize(14)
        .backgroundColor('#FF5252')
        .borderRadius(8)
        .width('40%')
        .margin({ right: 12 })
        .onClick(() => {
          this.status = UpdateStatus.DOWNLOADING;
          this.message = '正在准备更新...';
          this.progress = 0;
          this.startUpdate();
        })

      Button('返回')
        .fontSize(14)
        .backgroundColor('#9E9E9E')
        .borderRadius(8)
        .width('40%')
        .onClick(() => {
          router.back();
        })
    }
    .width('100%')
  }

  private async startUpdate(): Promise<void> {
    try {
      this.status = UpdateStatus.DOWNLOADING;
      this.message = '正在下载Web资源...';

      await this.updater.updateWebResource((pct: number) => {
        this.progress = pct;
      });

      this.status = UpdateStatus.COMPLETE;
      this.message = '更新完成';

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (e) {
      this.status = UpdateStatus.ERROR;
      this.message = '更新失败，请检查网络后重试';
    }
  }

  onBackPress(): boolean {
    if (this.status === UpdateStatus.DOWNLOADING ||
        this.status === UpdateStatus.EXTRACTING) {
      return true; // 更新中禁止返回
    }
    router.back();
    return true;
  }
}
