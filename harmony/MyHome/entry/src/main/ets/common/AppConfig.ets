/**
 * 应用全局常量配置
 * 集中管理所有环境相关参数，便于维护和修改
 */

/** ────────────── 远程资源 ────────────── */

/** Web 移动端资源 ZIP 包下载地址 */
export const WEB_RESOURCE_ZIP_URL: string =
  'https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/web/my-home-mobile.zip';

/** ────────────── 本地资源路径 ────────────── */

/** 本地 Web 资源存放目录名（位于应用沙箱 filesDir 下） */
export const LOCAL_WEB_DIR: string = 'web-resources';

/** Web 入口文件名 */
export const INDEX_FILE: string = 'index.html';

/** ZIP 下载临时文件名 */
export const TEMP_ZIP_FILE: string = 'update.zip';

/** ────────────── WebView ────────────── */

/** WebView 加载的远程网页地址（在线模式使用） */
export const HOME_URL: string = 'http://47.115.161.79:5173/';

/** ────────────── 返回键 ────────────── */

/** 两次返回键退出应用的间隔时间（毫秒），超时后重新计时 */
export const EXIT_INTERVAL: number = 2000;

/** Toast 提示文案 */
export const TOAST_EXIT_MSG: string = '再按一次退出应用';
export const TOAST_EXIT_DURATION: number = 2000;
