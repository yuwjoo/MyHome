/**
 * 下载模块 - APK 先下载到内存，后缀 zip 改为 apk 再保存到本地
 */
var Download = (function () {
  'use strict';

  var APK_URL = AppConfig.apkUrl;

  /**
   * 将远程 zip 文件下载到内存，触发浏览器另存为 .apk 文件
   */
  function downloadApk() {
    var $btn = $('#btnAndroid');
    var originalText = $btn.html();

    $btn.prop('disabled', true).html('<span class="btn-icon">⏳</span> 下载中...');

    fetch(APK_URL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('下载失败: HTTP ' + response.status);
        }
        var contentLength = response.headers.get('Content-Length');
        if (contentLength) {
          $('#apkSize').text(formatSize(parseInt(contentLength, 10)));
        }
        return response.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'MyHome.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        $btn.prop('disabled', false).html(originalText);
      })
      .catch(function (err) {
        console.error('APK 下载失败:', err);
        $btn.prop('disabled', false).html(originalText);
        alert('下载失败，请稍后重试');
      });
  }

  /** 格式化文件大小 */
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /** 绑定按钮事件 */
  function bind() {
    $('#btnAndroid').on('click', function (e) {
      e.preventDefault();
      downloadApk();
    });
  }

  return {
    bind: bind,
  };
})();
