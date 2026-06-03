/**
 * 本地 Web 资源请求拦截器
 */

import { webview } from '@kit.ArkWeb';
import { fileIo } from '@kit.CoreFileKit';
import { BaseConfig } from '../config/BaseConfig';
import { VersionUpdateConfig } from '../config/VersionUpdateConfig';

const LOCAL_WEB_PREFIX = 'http://local-web/'; // 本地资源域名前缀

/**
 * 文本类 MIME 类型集合
 */
const TEXT_MIME_SET: Set<string> = new Set([
  'text/html',
  'text/css',
  'application/javascript',
  'application/json',
  'image/svg+xml',
]);

export class LocalWebInterceptor {
  private webResourceDir: string; // 本地 Web 资源根目录绝对路径

  /**
   * @param context - 应用上下文，用于获取沙箱 filesDir
   */
  constructor(context: Context) {
    this.webResourceDir = context.filesDir + '/' + VersionUpdateConfig.localWebDir;
  }

  /**
   * 请求拦截回调，供 Web 组件的 onInterceptRequest 使用
   *
   * @param request - Web 资源请求信息
   * @returns 匹配到本地资源时返回 WebResourceResponse，否则返回 null（放行）
   */
  handleRequest(request: WebResourceRequest): WebResourceResponse | null {
    const url = request.getRequestUrl();

    if (!url.startsWith(LOCAL_WEB_PREFIX)) {
      return null;
    }

    const filePath = this.resolvePath(url);
    const mimeType = LocalWebInterceptor.getMimeType(filePath);

    try {
      const data = LocalWebInterceptor.readFile(filePath, LocalWebInterceptor.isTextMime(mimeType));
      return LocalWebInterceptor.buildResponse(mimeType, data);
    } catch (_e) {
      return this.fallbackIndex();
    }
  }

  /**
   * 将 URL 路径解析为本地文件绝对路径，路径为空时返回 index.html
   */
  private resolvePath(url: string): string {
    let path = url.substring(LOCAL_WEB_PREFIX.length);

    // 去除 query 和 hash
    const qi = path.indexOf('?');
    if (qi >= 0) {
      path = path.substring(0, qi);
    }
    const hi = path.indexOf('#');
    if (hi >= 0) {
      path = path.substring(0, hi);
    }

    if (!path) {
      return this.webResourceDir + '/' + BaseConfig.indexFile;
    }
    return this.webResourceDir + '/' + path;
  }

  /**
   * 文件不存在时返回 index.html 作为兜底
   */
  private fallbackIndex(): WebResourceResponse | null {
    const indexPath = this.webResourceDir + '/' + BaseConfig.indexFile;
    try {
      const data = fileIo.readTextSync(indexPath);
      return LocalWebInterceptor.buildResponse('text/html', data);
    } catch (_e) {
      return null;
    }
  }

  /**
   * 读取文件内容，文本类返回 string，二进制类返回 ArrayBuffer
   */
  private static readFile(filePath: string, isText: boolean): string | ArrayBuffer {
    if (isText) {
      return fileIo.readTextSync(filePath);
    }
    const file = fileIo.openSync(filePath, fileIo.OpenMode.READ_ONLY);
    try {
      const stat = fileIo.statSync(filePath);
      const buf = new ArrayBuffer(stat.size);
      fileIo.readSync(file.fd, buf);
      return buf;
    } finally {
      fileIo.closeSync(file);
    }
  }

  /**
   * 根据文件扩展名推断 MIME 类型
   */
  private static getMimeType(filePath: string): string {
    const dotIndex = filePath.lastIndexOf('.');
    if (dotIndex < 0) {
      return 'application/octet-stream';
    }
    const ext = filePath.substring(dotIndex).toLowerCase();
    switch (ext) {
      case '.html':
      case '.htm':
        return 'text/html';
      case '.css':
        return 'text/css';
      case '.js':
      case '.mjs':
        return 'application/javascript';
      case '.json':
        return 'application/json';
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.gif':
        return 'image/gif';
      case '.svg':
        return 'image/svg+xml';
      case '.ico':
        return 'image/x-icon';
      case '.webp':
        return 'image/webp';
      case '.woff':
        return 'font/woff';
      case '.woff2':
        return 'font/woff2';
      case '.ttf':
        return 'font/ttf';
      case '.otf':
        return 'font/otf';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * 判断是否为文本类 MIME 类型
   */
  private static isTextMime(mimeType: string): boolean {
    return TEXT_MIME_SET.has(mimeType);
  }

  /**
   * 构建 WebResourceResponse 实例
   *
   * @param mimeType - MIME 类型
   * @param data     - 响应数据
   */
  private static buildResponse(mimeType: string, data: string | ArrayBuffer): WebResourceResponse {
    const response = new WebResourceResponse();
    response.setResponseMimeType(mimeType);
    response.setResponseEncoding('UTF-8');
    response.setResponseData(data);
    response.setResponseCode(200);
    response.setReasonMessage('OK');
    return response;
  }
}
