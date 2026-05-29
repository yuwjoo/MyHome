/**
 * 合并路径
 * @param {string[]} ...arg 路径集合
 * @return 路径字符串
 */
export const join = (...arg: string[]): string => {
  return arg.reduce((p, s) => {
    if (s.startsWith("/")) s = s.slice(1);
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s ? `${p}${p ? "/" : ""}${s}` : p;
  }, "");
};
