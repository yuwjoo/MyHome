import moment from 'moment';
import path from 'path';

/**
 * 生成oss object
 * @param {string} name 文件名
 * @return {string} object
 */
export function generateOssObject(name: string): string {
  const storageBaseDir = process.env.OSS_BASE_DIR || '';
  return path.posix.join(
    storageBaseDir,
    moment().format('YYYY-MM-DD'),
    `${Date.now()}-${name}`,
  );
}
