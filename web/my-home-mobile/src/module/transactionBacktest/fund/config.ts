/**
 * 基金模块本地数据路径配置
 */

import path from 'path'

/** 本地数据根目录（相对进程运行目录） */
export const DATA_DIR = path.resolve(process.cwd(), 'data/fund')
/** 本地基金列表文件路径 */
export const LIST_FILE = path.join(DATA_DIR, 'fund-list.json')
/** 单只基金数据目录 */
export const FUND_DIR = path.join(DATA_DIR, 'funds')
