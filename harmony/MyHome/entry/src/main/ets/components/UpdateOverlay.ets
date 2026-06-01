/**
 * 版本更新进度弹窗
 */

import { UpdateStatus } from '../common/versionUpdate/UpdateStatus';

@Component
export struct UpdateOverlay {
  @Prop updateStatus: UpdateStatus = UpdateStatus.CHECKING; // 更新状态
  @Prop updateMessage: string = ''; // 状态提示文本
  @Prop updateProgress: number = 0; // 下载进度（0–100）

  build() {
    Column() {
      Column() {
        if (this.updateStatus === UpdateStatus.ERROR) {
          Text('✗')
            .fontSize(40)
            .fontColor('#FF5252')
            .margin({ bottom: 12 })
        } else if (this.updateStatus === UpdateStatus.COMPLETE) {
          Text('✓')
            .fontSize(40)
            .fontColor('#4CAF50')
            .margin({ bottom: 12 })
        } else {
          LoadingProgress()
            .width(40)
            .height(40)
            .color('#2196F3')
            .margin({ bottom: 12 })
        }

        Text(this.updateMessage)
          .fontSize(15)
          .fontColor('#333333')
          .textAlign(TextAlign.Center)
          .maxLines(3)

        if (this.updateStatus === UpdateStatus.DOWNLOADING) {
          Progress({
            value: this.updateProgress,
            total: 100,
            type: ProgressType.Linear,
          })
            .width('100%')
            .height(4)
            .style({ strokeWidth: 4 })
            .color('#2196F3')
            .margin({ top: 16 })

          Text(`${this.updateProgress}%`)
            .fontSize(13)
            .fontColor('#999999')
            .margin({ top: 6 })
        }
      }
      .width('75%')
      .padding(24)
      .borderRadius(12)
      .backgroundColor('#FFFFFF')
      .shadow({
        radius: 16,
        color: 'rgba(0,0,0,0.15)',
        offsetY: 4,
      })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .backgroundColor('rgba(0,0,0,0.4)')
  }
}
