/**
 * 应用全局常量配置
 * 集中管理所有环境相关参数，便于维护和修改
 */

/** WebView 加载的远程网页地址 */
export const HOME_URL: string = 'http://47.115.161.79:5173/';

/** 两次返回键退出应用的间隔时间（毫秒），超时后重新计时 */
export const EXIT_INTERVAL: number = 2000;

/** Toast 提示文案 */
export const TOAST_EXIT_MSG: string = '再按一次退出应用';
export const TOAST_EXIT_DURATION: number = 2000;
