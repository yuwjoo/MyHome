import { webview } from '@kit.ArkWeb';
import { window } from '@kit.ArkUI';
import { promptAction } from '@kit.ArkUI';

/** 网页地址 */
const HOME_URL: string = 'http://47.115.161.79:5173/';
/** 两次返回退出间隔（毫秒） */
const EXIT_INTERVAL: number = 2000;

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController();
  @State statusBarHeight: number = 0;
  private lastBackTime: number = 0;

  aboutToAppear(): void {
    // 获取状态栏高度（vp 即 CSS 像素，直接传前端，不做 dpr 换算）
    window.getLastWindow(getContext(this)).then((win: window.Window) => {
      let type: window.AvoidAreaType = window.AvoidAreaType.TYPE_SYSTEM;
      try {
        let avoidArea = win.getWindowAvoidArea(type);
        // avoidArea.topRect.height 单位为 vp，等同于 CSS px，直接传递
        this.statusBarHeight = avoidArea.topRect.height;
      } catch (e) {
        this.statusBarHeight = 0;
      }
    }).catch(() => {
      this.statusBarHeight = 0;
    });
  }

  /** 处理返回键：优先回退 WebView，不能回退时两次返回退出 */
  handleBackPress(): boolean {
    if (this.controller.accessBackward()) {
      this.controller.backward();
      return true; // 消费事件，WebView 内部回退
    }
    const now = Date.now();
    if (now - this.lastBackTime < EXIT_INTERVAL) {
      // 2 秒内再次返回，不消费事件，由系统退出 App
      return false;
    }
    this.lastBackTime = now;
    promptAction.showToast({ message: '再按一次退出应用', duration: 2000 });
    return true; // 消费事件，阻止退出
  }

  build() {
    Column() {
      Web({ src: HOME_URL, controller: this.controller })
        .domStorageAccess(true)
        .javaScriptAccess(true)
        .mixedMode(MixedMode.All)
        .zoomAccess(false)
        .overviewModeAccess(true)
        .width('100%')
        .height('100%')
        .onPageEnd(() => {
          // 注入 Native 桥接数据，与 Android 端格式一致
          // statusBarHeight 已是 CSS 像素（vp），前端直接使用
          this.controller.runJavaScript(`
            (function() {
              window.__NATIVE__ = {
                statusBarHeight: ${this.statusBarHeight},
                isHarmony: true
              };
              document.documentElement.style.setProperty('--status-bar-height', '${this.statusBarHeight}px');
              document.documentElement.dispatchEvent(new CustomEvent('nativeBridgeReady'));
            })();
          `).catch(() => {
            // TODO: Implement error handling.
          });
        })
    }
    .width('100%')
    .height('100%')
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }

  /** 返回键拦截：优先 WebView 回退，不能回退时两次返回退出 */
  onBackPress(): boolean {
    return this.handleBackPress();
  }
}