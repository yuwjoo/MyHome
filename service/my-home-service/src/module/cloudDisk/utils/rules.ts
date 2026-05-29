/**
 * 校验是否合法文件名称
 * @param fileName 文件名称
 * @return 是否合法文件名称
 */
export function testFileName(fileName: string): boolean {
  // 文件名称不能包含以下字符：\/:*?"<>|
  const invalidChars = /[\/\\:\*\?"<>\|]/;
  return !invalidChars.test(fileName);
}
