import path from 'path';
import { FilePathData } from '../types/utils.type';

/**
 * 解析文件路径
 * @param paths 路径集合
 * @return 文件路径数据
 */
export function parseFilePath(...paths: string[]): FilePathData {
  const pathStr = joinFilePath(...paths);
  const filePathData = {
    filePath: pathStr,
    fileParentPath: '',
    fileName: '',
    fileDepth: 0,
  };

  if (pathStr !== '/') {
    const arr = pathStr.split('/');
    filePathData.fileDepth = arr.length - 1;
    filePathData.fileName = arr.pop() || '';
    filePathData.fileParentPath = arr.join('/') || '/';
  }

  return filePathData;
}

/**
 * 拼接路径
 * @param paths 路径集合
 * @return 路径
 */
export function joinFilePath(...paths: string[]): string {
  return path.posix.join(`/${paths.join('/')}`);
}

/**
 * 获取上级路径集合
 * @param filePath 文件路径
 * @return 上级路径集合
 */
export function getParentPaths(filePath: string): string[] {
  const paths: string[] = [];
  const parts = filePath.split('/').filter(Boolean);

  let current = '';
  for (let i = 0; i < parts.length - 1; i++) {
    current += `/${parts[i]}`;
    paths.push(current);
  }

  return paths;
}
