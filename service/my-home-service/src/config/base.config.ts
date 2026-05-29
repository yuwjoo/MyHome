import { registerAs } from '@nestjs/config';
import path from 'path';

export interface BaseConfig {
  projectRoot: string; // 项目根目录
}

/**
 * 基础配置
 */
export default registerAs('base', (): BaseConfig => {
  return {
    projectRoot: path.join(__dirname, '..'),
  };
});
