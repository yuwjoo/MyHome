import OSS from 'ali-oss';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import type { OssConfig } from './types';

interface CredentialsYaml {
  oss: OssConfig;
}

const configPath = resolve(process.cwd(), '.secret', 'credentials.yaml');
const yaml = load(readFileSync(configPath, 'utf-8')) as CredentialsYaml;

export default new OSS(yaml.oss);
