/**
 * 入口模块 - 页面初始化
 */
$(function () {
  'use strict';

  // 设置页脚年份
  $('#year').text(new Date().getFullYear());

  // 从配置更新外链
  $('#linkContact').attr('href', AppConfig.contactEmail);

  // 初始化各模块
  Scroll.init();
  Anim.init();

  // 拉取版本信息
  Version.fetch();

  // 绑定下载事件
  Download.bind();

  // 首页 Hero 内容动画先展示
  setTimeout(function () {
    $('.hero-content').addClass('animate-in');
  }, 200);
});
