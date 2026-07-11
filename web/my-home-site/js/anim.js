/**
 * 动画模块 - 入场动画、数字滚动、移动端菜单
 */
var Anim = (function () {
  'use strict';

  var OBSERVER_THRESHOLD = 0.2;

  /** 滚动入场动画 */
  function initReveal() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          $(entry.target).addClass('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: OBSERVER_THRESHOLD });

    $('.feature-card, .platform-card, .download-card, .showcase-frame').each(function () {
      observer.observe(this);
    });
  }

  /** 数字滚动计数动画 */
  function animCount($el) {
    var target = parseInt($el.data('count'), 10);
    if (isNaN(target)) return;
    $({ val: 0 }).animate({ val: target }, {
      duration: 1000,
      easing: 'swing',
      step: function (now) {
        $el.text(Math.floor(now));
      },
      complete: function () {
        $el.text(target);
      },
    });
  }

  function initCountUp() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animCount($(entry.target));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    $('.stat-num').each(function () {
      observer.observe(this);
    });
  }

  /** 移动端汉堡菜单 */
  function initMobileMenu() {
    var $toggle = $('#navToggle');
    var $links = $('#navLinks');
    var $items = $links.find('a');

    $toggle.on('click', function () {
      $toggle.toggleClass('open');
      $links.toggleClass('open');
    });

    $items.on('click', function () {
      $toggle.removeClass('open');
      $links.removeClass('open');
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('.nav-inner').length) {
        $toggle.removeClass('open');
        $links.removeClass('open');
      }
    });
  }

  function init() {
    initReveal();
    initCountUp();
    initMobileMenu();
  }

  return { init: init };
})();
