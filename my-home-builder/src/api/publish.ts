/**
 * 发布相关 API
 */

import http from './http';

/** 获取构建历史 */
export const fetchBuildHistory = () => {
  return http.get('/api/build/history');
};

/** 提交构建任务 */
export const submitBuildTask = (data: Record<string, unknown>) => {
  return http.post('/api/build/submit', data);
};

/** 获取构建状态 */
export const getBuildStatus = (taskId: string) => {
  return http.get(`/api/build/status/${taskId}`);
};
