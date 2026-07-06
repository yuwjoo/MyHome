import OSS from 'ali-oss';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OssConfig } from './types';

const configPath = resolve(process.cwd(), '.secret', 'oss.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8')) as OssConfig;

export default new OSS(config);
