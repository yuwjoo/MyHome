(() => {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;inset:0;padding:env(safe-area-inset-top,111px) env(safe-area-inset-right,111px) env(safe-area-inset-bottom,111px) env(safe-area-inset-left,111px);visibility:hidden'
  document.documentElement.appendChild(probe)
  const cs = getComputedStyle(probe)
  const result = {
    url: location.href,
    path: location.pathname,
    innerW: innerWidth,
    innerH: innerHeight,
    dpr: devicePixelRatio,
    envTop: cs.paddingTop,
    envRight: cs.paddingRight,
    envBottom: cs.paddingBottom,
    envLeft: cs.paddingLeft,
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    rootSafeVars: {
      '--safe-top': getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-top')
        .trim(),
      '--safe-bottom': getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-bottom')
        .trim(),
    },
    headers: [
      ...document.querySelectorAll(
        'header, .app-header, [class*="header"], [class*="search"]',
      ),
    ]
      .slice(0, 8)
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          cls: String(el.className).slice(0, 70),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          h: Math.round(r.height),
        }
      }),
  }
  probe.remove()
  return result
})()
