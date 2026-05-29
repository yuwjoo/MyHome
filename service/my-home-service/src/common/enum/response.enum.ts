/**
 * 业务响应码枚举
 */
export enum ResponseCode {
  /**
   * 成功响应码
   */
  SUCCESS = 20200,
  /**
   * 异常响应码
   */
  ERROR = 40400,
  /**
   * 未授权响应码
   */
  UNAUTHORIZED = 40401,
  /**
   * 服务器异常响应码
   */
  SERVER_ERROR = 50500,
}

/**
 * 业务响应消息枚举
 */
export enum ResponseMsg {
  /**
   * 成功响应消息
   */
  SUCCESS = '请求成功',
  /**
   * 异常响应消息
   */
  ERROR = '请求失败',
  /**
   * 未授权响应消息
   */
  UNAUTHORIZED = '未授权或token过期，请重新登录',
  /**
   * 服务器异常响应消息
   */
  SERVER_ERROR = '服务器内部错误',
}
