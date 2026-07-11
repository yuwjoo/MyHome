/**
 * 版本信息模块 - 从远程 manifest 获取最新版本号
 */
var Version = (function () {
  'use strict';

  var MANIFEST_URL = AppConfig.manifestUrl;

  var defaults = {
    android: '0.0.16',
    harmony: '1.0.0',
    web: '0.0.12',
  };

  /** 更新页面上所有版本号 */
  function updateUI(versions) {
    $('.ver-android').text(versions.android || defaults.android);
    $('.ver-harmony').text(versions.harmony || defaults.harmony);
    $('.ver-web').text(versions.web || defaults.web);
    $('#heroVersion').text(versions.android || defaults.android);
  }

  /** 从远程拉取版本清单 */
  function fetchVersions() {
    return $.ajax({
      url: MANIFEST_URL,
      dataType: 'json',
      timeout: 5000,
    }).then(function (data) {
      var versions = {
        android: (data.android && data.android.MyHome) || defaults.android,
        harmony: (data.harmony && data.harmony.MyHome) || defaults.harmony,
        web: (data.web && data.web['my-home-mobile']) || defaults.web,
      };
      updateUI(versions);
      return versions;
    }).fail(function () {
      updateUI(defaults);
    });
  }

  return {
    fetch: fetchVersions,
    updateUI: updateUI,
  };
})();
