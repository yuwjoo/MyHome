/**
 * 分组消息汇总导出
 * key 为分组名称，value 为该分组的消息处理器映射
 */
import { localFileGroup } from './localFileGroup';
import { shellGroup } from './shellGroup';

export const bridgeGroup = {
  localFile: localFileGroup,
  shell: shellGroup,
};
