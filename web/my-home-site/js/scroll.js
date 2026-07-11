/**
 * 滚动交互模块 - 导航栏、锚点高亮、回到顶部
 */
var Scroll = (function () {
  'use strict';

  var $nav = $('#nav');
  var $backTop = $('#backTop');
  var $navLinks = $('.nav-links a');

  /** 导航栏滚动效果 */
  function handleNavScroll() {
    var scrollY = $(window).scrollTop();
    $nav.toggleClass('scrolled', scrollY > 60);
    $backTop.toggleClass('visible', scrollY > 500);
  }

  /** 更新导航链接的 active 状态 */
  function updateActiveLink() {
    var scrollY = $(window).scrollTop() + 100;
    $navLinks.each(function () {
      var $link = $(this);
      var target = $($link.attr('href'));
      if (!target.length) return;
      var top = target.offset().top;
      var bottom = top + target.outerHeight();
      $link.toggleClass('active', scrollY >= top && scrollY < bottom);
    });
  }

  /** 平滑滚动到锚点 */
  function smoothScroll(e) {
    var href = $(this).attr('href');
    if (!href || href.charAt(0) !== '#') return;
    e.preventDefault();
    var $target = $(href);
    if ($target.length) {
      $('html, body').animate({ scrollTop: $target.offset().top - 70 }, 500);
    }
  }

  /** 回到顶部 */
  function scrollToTop() {
    $('html, body').animate({ scrollTop: 0 }, 400);
  }

  function init() {
    $(window).on('scroll', function () {
      requestAnimationFrame(function () {
        handleNavScroll();
        updateActiveLink();
      });
    });
    $navLinks.on('click', smoothScroll);
    $backTop.on('click', scrollToTop);
  }

  return { init: init };
})();
